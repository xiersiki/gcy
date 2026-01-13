export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ensureSafeId } from '@/shared/id'

export async function POST(req: Request) {
  const { getRequestId } = await import('@/server/api/request')
  const requestId = getRequestId(req)
  try {
    const { ApiErrorCode } = await import('@/server/api/errors')
    const { jsonError, jsonOk } = await import('@/server/api/response')
    const { checkRateLimit } = await import('@/server/api/ratelimit')
    const { getSupabaseEnv } = await import('@/server/supabase/env')
    const { getSupabaseServerClient } = await import('@/server/supabase/server')

    type Payload = { authorId: string; slug: string; implementAuthorId: string }
    const body = (await req.json().catch(() => null)) as Payload | null
    if (!body)
      return jsonError(ApiErrorCode.BadRequest, '缺少有效 payload', 400, {
        headers: { 'x-request-id': requestId },
      })

    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey)
      return jsonError(ApiErrorCode.SupabaseNotConfigured, 'Supabase 未配置', 500, {
        headers: { 'x-request-id': requestId },
      })

    const supabase = await getSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user)
      return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
        headers: { 'x-request-id': requestId },
      })
    const user = userData.user

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
    const rateKey = `ideas:claim:${user.id}:${ip}`
    if (!checkRateLimit(rateKey, 10, 60_000).ok) {
      return jsonError(ApiErrorCode.RateLimited, '操作过于频繁，请稍后再试', 429, {
        headers: { 'x-request-id': requestId },
      })
    }

    const ideaAuthorId = ensureSafeId(body.authorId, 'authorId')
    const ideaSlug = ensureSafeId(body.slug, 'slug')
    const implementAuthorId = ensureSafeId(body.implementAuthorId, 'implementAuthorId')

    const { data: existing, error: findErr } = await supabase
      .from('ideas')
      .select('*')
      .eq('author_id', ideaAuthorId)
      .eq('slug', ideaSlug)
      .maybeSingle()
    if (findErr)
      return jsonError(ApiErrorCode.SupabaseError, findErr.message, 500, {
        headers: { 'x-request-id': requestId },
      })
    if (!existing)
      return jsonError(ApiErrorCode.NotFound, '点子不存在', 404, {
        headers: { 'x-request-id': requestId },
      })

    const status = String((existing as Record<string, unknown>).status ?? 'open')
    const claimedBy = (existing as Record<string, unknown>).claimed_by
      ? String((existing as Record<string, unknown>).claimed_by)
      : null
    const existingPrUrl = (existing as Record<string, unknown>).claim_pr_url
      ? String((existing as Record<string, unknown>).claim_pr_url)
      : null

    if (status === 'done')
      return jsonError(ApiErrorCode.Conflict, '该点子已实现', 409, {
        headers: { 'x-request-id': requestId },
      })
    if (status === 'in-progress' && claimedBy && claimedBy !== user.id) {
      return jsonError(ApiErrorCode.Conflict, '该点子已被他人认领', 409, {
        headers: { 'x-request-id': requestId },
      })
    }
    if (existingPrUrl)
      return jsonOk({ prUrl: existingPrUrl }, { headers: { 'x-request-id': requestId } })

    if (status === 'open') {
      const { data: claimed, error: claimErr } = await supabase
        .from('ideas')
        .update({
          status: 'in-progress',
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('author_id', ideaAuthorId)
        .eq('slug', ideaSlug)
        .eq('status', 'open')
        .select('status, claimed_by')
        .maybeSingle()
      if (claimErr)
        return jsonError(ApiErrorCode.SupabaseError, claimErr.message, 500, {
          headers: { 'x-request-id': requestId },
        })
      if (!claimed)
        return jsonError(ApiErrorCode.Conflict, '该点子已被他人抢先认领', 409, {
          headers: { 'x-request-id': requestId },
        })
    }

    const { createGitHubClient, githubRequest } = await import('@/server/github/client')
    let ghClient: {
      owner: string
      repo: string
      base: string
      request: (p: string, i: RequestInit) => Promise<Response>
    }
    try {
      ghClient = createGitHubClient()
    } catch {
      return jsonError(ApiErrorCode.GitHubError, '缺少 GitHub 配置', 500, {
        headers: { 'x-request-id': requestId },
      })
    }
    const { owner, repo, base } = ghClient

    async function checkExists(path: string, ref: string) {
      const r = await githubRequest(
        ghClient,
        `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
        { method: 'GET' },
      )
      if (r.status === 404) return false
      return r.ok
    }

    const title =
      String((existing as Record<string, unknown>).title ?? '').trim() ||
      `${ideaAuthorId}/${ideaSlug}`
    const summary = String((existing as Record<string, unknown>).summary ?? '').trim() || title
    const tags = Array.isArray((existing as Record<string, unknown>).tags)
      ? ((existing as Record<string, unknown>).tags as unknown[])
          .map(String)
          .filter(Boolean)
          .slice(0, 12)
      : []

    let workSlug = ideaSlug
    for (let i = 2; i <= 9; i += 1) {
      const metaPath = `content/works/${implementAuthorId}/${workSlug}/meta.yml`
      const demoPath = `demos/${implementAuthorId}/${workSlug}/package.json`
      if (!(await checkExists(metaPath, base)) && !(await checkExists(demoPath, base))) break
      workSlug = `${ideaSlug}-${i}`
    }

    function toIsoDate() {
      const d = new Date()
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const workMeta = [
      `title: ${title}`,
      `summary: ${summary}`,
      `type: demo`,
      `date: ${toIsoDate()}`,
      `draft: true`,
      `sourceIdeaId: ${ideaAuthorId}/${ideaSlug}`,
      ...(tags.length ? ['tags:', ...tags.map((t) => `  - ${t}`)] : []),
      `demo:`,
      `  kind: iframe`,
      `  src: /demos/${implementAuthorId}/${workSlug}/`,
      `  devSrc: http://localhost:5173/`,
      `  height: 720`,
      ``,
    ].join('\n')

    const workMdx = [
      `# ${title}`,
      ``,
      `来源点子：${ideaAuthorId}/${ideaSlug}`,
      ``,
      `## 目标`,
      ``,
      summary,
      ``,
      `## 实现记录`,
      ``,
      `- `,
      ``,
    ].join('\n')

    function demoPackageJson(authorId: string, slug: string) {
      return JSON.stringify(
        {
          name: `@demo/${authorId}-${slug}`,
          private: true,
          version: '0.0.0',
          type: 'module',
          scripts: {
            dev: 'vite --port 5173 --strictPort',
            build: 'vite build',
            preview: 'vite preview --port 4173',
          },
          dependencies: {
            react: '^19.2.0',
            'react-dom': '^19.2.0',
          },
          devDependencies: {
            vite: '^5.4.21',
          },
        },
        null,
        2,
      )
    }

    function demoViteConfig() {
      return `import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  base: './',\n})\n`
    }

    function demoIndexHtml(pageTitle: string) {
      return [
        '<!doctype html>',
        '<html lang="zh-CN">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `    <title>${pageTitle}</title>`,
        '  </head>',
        '  <body>',
        '    <div id="root"></div>',
        '    <script type="module" src="/src/main.jsx"></script>',
        '  </body>',
        '</html>',
        '',
      ].join('\n')
    }

    function demoMainJsx() {
      return [
        "import React from 'react'",
        "import { createRoot } from 'react-dom/client'",
        "import App from './App.jsx'",
        '',
        'function postResize() {',
        '  const height = Math.max(',
        '    document.documentElement.scrollHeight,',
        '    document.body?.scrollHeight ?? 0,',
        '    document.documentElement.offsetHeight,',
        '    document.body?.offsetHeight ?? 0,',
        '  )',
        "  let targetOrigin = '*'",
        '  try {',
        '    if (document.referrer) targetOrigin = new URL(document.referrer).origin',
        '  } catch {}',
        "  window.parent?.postMessage({ type: 'demo:resize', height }, targetOrigin)",
        '}',
        '',
        "const rootEl = document.getElementById('root')",
        'const root = createRoot(rootEl)',
        'root.render(<App onChange={() => postResize()} />)',
        '',
        'window.addEventListener("load", postResize)',
        'window.addEventListener("resize", postResize)',
        '',
      ].join('\n')
    }

    function demoAppJsx() {
      return [
        "import React, { useEffect, useState } from 'react'",
        '',
        'export default function App({ onChange }) {',
        '  const [count, setCount] = useState(0)',
        '  useEffect(() => {',
        '    if (typeof onChange === "function") onChange()',
        '  }, [count, onChange])',
        '  return (',
        '    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>',
        '      <h1 style={{ margin: 0, fontSize: 18 }}>WIP Demo</h1>',
        '      <div style={{ height: 12 }} />',
        '      <button type="button" onClick={() => setCount((v) => v + 1)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", background: "transparent", cursor: "pointer" }}>+1</button>',
        '      <span style={{ marginLeft: 12, fontVariantNumeric: "tabular-nums" }}>{count}</span>',
        '    </div>',
        '  )',
        '}',
        '',
      ].join('\n')
    }

    const refRes = await githubRequest(ghClient, `/repos/${owner}/${repo}/git/refs/heads/${base}`, {
      method: 'GET',
    })
    if (!refRes.ok) {
      const raw = await refRes.text().catch(() => '')
      return jsonError(ApiErrorCode.GitHubError, `获取基准分支失败：${raw.slice(0, 200)}`, 500, {
        headers: { 'x-request-id': requestId },
      })
    }
    const refData = (await refRes.json()) as { object: { sha: string } }
    const baseCommitSha = refData.object.sha

    const commitRes = await githubRequest(
      ghClient,
      `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
      { method: 'GET' },
    )
    if (!commitRes.ok) {
      const raw = await commitRes.text().catch(() => '')
      return jsonError(ApiErrorCode.GitHubError, `获取提交信息失败：${raw.slice(0, 200)}`, 500, {
        headers: { 'x-request-id': requestId },
      })
    }
    const commitData = (await commitRes.json()) as { tree: { sha: string } }
    const baseTreeSha = commitData.tree.sha

    const treeRes = await githubRequest(ghClient, `/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: `content/works/${implementAuthorId}/${workSlug}/meta.yml`,
            mode: '100644',
            type: 'blob',
            content: workMeta,
          },
          {
            path: `content/works/${implementAuthorId}/${workSlug}/index.mdx`,
            mode: '100644',
            type: 'blob',
            content: `${workMdx}\n`,
          },
          {
            path: `demos/${implementAuthorId}/${workSlug}/package.json`,
            mode: '100644',
            type: 'blob',
            content: demoPackageJson(implementAuthorId, workSlug),
          },
          {
            path: `demos/${implementAuthorId}/${workSlug}/vite.config.js`,
            mode: '100644',
            type: 'blob',
            content: demoViteConfig(),
          },
          {
            path: `demos/${implementAuthorId}/${workSlug}/index.html`,
            mode: '100644',
            type: 'blob',
            content: demoIndexHtml(title),
          },
          {
            path: `demos/${implementAuthorId}/${workSlug}/src/main.jsx`,
            mode: '100644',
            type: 'blob',
            content: demoMainJsx(),
          },
          {
            path: `demos/${implementAuthorId}/${workSlug}/src/App.jsx`,
            mode: '100644',
            type: 'blob',
            content: demoAppJsx(),
          },
        ],
      }),
    })
    if (!treeRes.ok) {
      const raw = await treeRes.text().catch(() => '')
      return jsonError(ApiErrorCode.GitHubError, `创建树失败：${raw.slice(0, 200)}`, 500, {
        headers: { 'x-request-id': requestId },
      })
    }
    const treeData = (await treeRes.json()) as { sha: string }

    const branchName = `impl/${user.id.slice(0, 8)}/${implementAuthorId}-${ideaSlug}`

    const newCommitRes = await githubRequest(ghClient, `/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: `chore(ideas): claim ${ideaAuthorId}/${ideaSlug}`,
        tree: treeData.sha,
        parents: [baseCommitSha],
      }),
    })
    if (!newCommitRes.ok) {
      const raw = await newCommitRes.text().catch(() => '')
      return jsonError(ApiErrorCode.GitHubError, `创建提交失败：${raw.slice(0, 200)}`, 500, {
        headers: { 'x-request-id': requestId },
      })
    }
    const newCommitData = (await newCommitRes.json()) as { sha: string }

    const refCreateRes = await githubRequest(ghClient, `/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: newCommitData.sha }),
    })
    if (!refCreateRes.ok) {
      const raw = await refCreateRes.text().catch(() => '')
      if (refCreateRes.status === 422 && raw.includes('Reference already exists')) {
        const updateRes = await githubRequest(
          ghClient,
          `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ sha: newCommitData.sha, force: true }),
          },
        )
        if (!updateRes.ok) {
          const updateRaw = await updateRes.text().catch(() => '')
          return jsonError(
            ApiErrorCode.GitHubError,
            `更新分支失败：${updateRaw.slice(0, 200)}`,
            500,
            {
              headers: { 'x-request-id': requestId },
            },
          )
        }
      } else {
        return jsonError(ApiErrorCode.GitHubError, `创建分支失败：${raw.slice(0, 200)}`, 500, {
          headers: { 'x-request-id': requestId },
        })
      }
    }

    const prRes = await githubRequest(ghClient, `/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: `wip: ${title}`,
        head: branchName,
        base,
        body: `Idea: ${ideaAuthorId}/${ideaSlug}\n\nClaimed by: ${user.email ?? user.id}\n\nWork: ${implementAuthorId}/${workSlug}`,
      }),
    })
    let prUrl: string | null = null
    if (prRes.ok) {
      const prData = (await prRes.json()) as { html_url: string }
      prUrl = prData.html_url
    } else {
      const raw = await prRes.text().catch(() => '')
      if (prRes.status === 422 && raw.toLowerCase().includes('already exists')) {
        const listRes = await githubRequest(
          ghClient,
          `/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${branchName}`)}&state=open`,
          { method: 'GET' },
        )
        if (listRes.ok) {
          const list = (await listRes.json().catch(() => [])) as Array<{ html_url?: string }>
          prUrl = list[0]?.html_url ?? null
        }
      }
      if (!prUrl)
        return jsonError(ApiErrorCode.GitHubError, `创建 PR 失败：${raw.slice(0, 200)}`, 500, {
          headers: { 'x-request-id': requestId },
        })
    }

    await supabase
      .from('ideas')
      .update({
        status: 'in-progress',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        claim_pr_url: prUrl,
      })
      .eq('author_id', ideaAuthorId)
      .eq('slug', ideaSlug)

    console.info(
      JSON.stringify({
        requestId,
        event: 'ideas.claim',
        ideaAuthorId,
        ideaSlug,
        implementAuthorId,
      }),
    )
    return jsonOk({ prUrl }, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const { ApiErrorCode } = await import('@/server/api/errors')
    const { jsonError } = await import('@/server/api/response')
    const message = err instanceof Error ? err.message : '认领失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
