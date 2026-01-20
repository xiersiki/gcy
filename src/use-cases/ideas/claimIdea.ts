import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { ApiErrorCode } from '@/server/api/errors'
import { ensureSafeId } from '@/shared/id'
import { normalizeIdeaStatus } from '@/shared/ideas/mapper'
import type { GitHubClient } from '@/server/github/client'
import type { UseCaseResult } from '../types'

export const ClaimIdeaInputSchema = z.object({
  authorId: z.string(),
  slug: z.string(),
  implementAuthorId: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  ip: z.string(),
})

export type ClaimIdeaInput = z.infer<typeof ClaimIdeaInputSchema>

export type ClaimIdeaOutput = { prUrl: string }

export type ClaimIdeaDeps = {
  supabase: SupabaseClient
  ghClient: GitHubClient
  githubRequest: (
    client: GitHubClient,
    path: string,
    init: RequestInit,
    opts?: { retries?: number },
  ) => Promise<Response>
  checkRateLimit: (key: string, limit: number, windowMs: number) => { ok: boolean }
  now: () => Date
}

export async function claimIdea(
  input: ClaimIdeaInput,
  deps: ClaimIdeaDeps,
): Promise<UseCaseResult<ClaimIdeaOutput, ApiErrorCode>> {
  const parsed = ClaimIdeaInputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: { code: ApiErrorCode.BadRequest, message: '缺少有效 payload', status: 400 },
    }

  const rateKey = `ideas:claim:${parsed.data.userId}:${parsed.data.ip}`
  if (!deps.checkRateLimit(rateKey, 10, 60_000).ok)
    return {
      ok: false,
      error: { code: ApiErrorCode.RateLimited, message: '操作过于频繁，请稍后再试', status: 429 },
    }

  const ideaAuthorId = ensureSafeId(parsed.data.authorId, 'authorId')
  const ideaSlug = ensureSafeId(parsed.data.slug, 'slug')
  const implementAuthorId = ensureSafeId(parsed.data.implementAuthorId, 'implementAuthorId')

  const { data: existing, error: findErr } = await deps.supabase
    .from('ideas')
    .select('*')
    .eq('author_id', ideaAuthorId)
    .eq('slug', ideaSlug)
    .maybeSingle()
  if (findErr)
    return {
      ok: false,
      error: { code: ApiErrorCode.SupabaseError, message: findErr.message, status: 500 },
    }
  if (!existing)
    return { ok: false, error: { code: ApiErrorCode.NotFound, message: '点子不存在', status: 404 } }

  const existingRec = existing as Record<string, unknown>
  const status = normalizeIdeaStatus(existingRec.status)
  const claimedBy = existingRec.claimed_by ? String(existingRec.claimed_by) : null
  const existingPrUrl = existingRec.claim_pr_url ? String(existingRec.claim_pr_url) : null

  if (status === 'done')
    return {
      ok: false,
      error: { code: ApiErrorCode.Conflict, message: '该点子已实现', status: 409 },
    }
  if (status === 'in-progress' && claimedBy && claimedBy !== parsed.data.userId) {
    return {
      ok: false,
      error: { code: ApiErrorCode.Conflict, message: '该点子已被他人认领', status: 409 },
    }
  }
  if (existingPrUrl) return { ok: true, data: { prUrl: existingPrUrl } }

  if (status === 'open') {
    const { data: claimed, error: claimErr } = await deps.supabase
      .from('ideas')
      .update({
        status: 'in-progress',
        claimed_by: parsed.data.userId,
        claimed_at: deps.now().toISOString(),
      })
      .eq('author_id', ideaAuthorId)
      .eq('slug', ideaSlug)
      .eq('status', 'open')
      .select('status, claimed_by')
      .maybeSingle()
    if (claimErr)
      return {
        ok: false,
        error: { code: ApiErrorCode.SupabaseError, message: claimErr.message, status: 500 },
      }
    if (!claimed)
      return {
        ok: false,
        error: { code: ApiErrorCode.Conflict, message: '该点子已被他人抢先认领', status: 409 },
      }
  }

  const { owner, repo, base } = deps.ghClient

  async function checkExists(path: string, ref: string) {
    const r = await deps.githubRequest(
      deps.ghClient,
      `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      { method: 'GET' },
    )
    if (r.status === 404) return false
    return r.ok
  }

  const title = String(existingRec.title ?? '').trim() || `${ideaAuthorId}/${ideaSlug}`
  const summary = String(existingRec.summary ?? '').trim() || title
  const tags = Array.isArray(existingRec.tags)
    ? (existingRec.tags as unknown[]).map(String).filter(Boolean).slice(0, 12)
    : []

  let workSlug = ideaSlug
  for (let i = 2; i <= 9; i += 1) {
    const metaPath = `content/works/${implementAuthorId}/${workSlug}/meta.yml`
    const demoPath = `demos/${implementAuthorId}/${workSlug}/package.json`
    if (!(await checkExists(metaPath, base)) && !(await checkExists(demoPath, base))) break
    workSlug = `${ideaSlug}-${i}`
  }

  function toIsoDate() {
    const d = deps.now()
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
    `  src: /demos/${implementAuthorId}/${workSlug}/index.html`,
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

  const refRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/git/refs/heads/${base}`,
    {
      method: 'GET',
    },
  )
  if (!refRes.ok) {
    const raw = await refRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `获取基准分支失败：${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const refData = (await refRes.json()) as { object: { sha: string } }
  const baseCommitSha = refData.object.sha

  const commitRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
    {
      method: 'GET',
    },
  )
  if (!commitRes.ok) {
    const raw = await commitRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `获取提交信息失败：${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const commitData = (await commitRes.json()) as { tree: { sha: string } }
  const baseTreeSha = commitData.tree.sha

  const treeRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/git/trees`, {
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
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `创建树失败：${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const treeData = (await treeRes.json()) as { sha: string }

  const branchName = `impl/${parsed.data.userId.slice(0, 8)}/${implementAuthorId}-${ideaSlug}`

  const newCommitRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: `chore(ideas): claim ${ideaAuthorId}/${ideaSlug}`,
        tree: treeData.sha,
        parents: [baseCommitSha],
      }),
    },
  )
  if (!newCommitRes.ok) {
    const raw = await newCommitRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `创建提交失败：${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const newCommitData = (await newCommitRes.json()) as { sha: string }

  const refCreateRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: newCommitData.sha }),
  })
  if (!refCreateRes.ok) {
    const raw = await refCreateRes.text().catch(() => '')
    if (refCreateRes.status === 422 && raw.includes('Reference already exists')) {
      const updateRes = await deps.githubRequest(
        deps.ghClient,
        `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ sha: newCommitData.sha, force: true }),
        },
      )
      if (!updateRes.ok) {
        const updateRaw = await updateRes.text().catch(() => '')
        return {
          ok: false,
          error: {
            code: ApiErrorCode.GitHubError,
            message: `更新分支失败：${updateRaw.slice(0, 200)}`,
            status: 500,
          },
        }
      }
    } else {
      return {
        ok: false,
        error: {
          code: ApiErrorCode.GitHubError,
          message: `创建分支失败：${raw.slice(0, 200)}`,
          status: 500,
        },
      }
    }
  }

  const prRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `wip: ${title}`,
      head: branchName,
      base,
      body: `Idea: ${ideaAuthorId}/${ideaSlug}\n\nClaimed by: ${parsed.data.userEmail ?? parsed.data.userId}\n\nWork: ${implementAuthorId}/${workSlug}`,
    }),
  })
  let prUrl: string | null = null
  if (prRes.ok) {
    const prData = (await prRes.json()) as { html_url: string }
    prUrl = prData.html_url
  } else {
    const raw = await prRes.text().catch(() => '')
    if (prRes.status === 422 && raw.toLowerCase().includes('already exists')) {
      const listRes = await deps.githubRequest(
        deps.ghClient,
        `/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${branchName}`)}&state=open`,
        { method: 'GET' },
      )
      if (listRes.ok) {
        const list = (await listRes.json().catch(() => [])) as Array<{ html_url?: string }>
        prUrl = list[0]?.html_url ?? null
      }
    }
    if (!prUrl)
      return {
        ok: false,
        error: {
          code: ApiErrorCode.GitHubError,
          message: `创建 PR 失败：${raw.slice(0, 200)}`,
          status: 500,
        },
      }
  }

  await deps.supabase
    .from('ideas')
    .update({
      status: 'in-progress',
      claimed_by: parsed.data.userId,
      claimed_at: deps.now().toISOString(),
      claim_pr_url: prUrl,
    })
    .eq('author_id', ideaAuthorId)
    .eq('slug', ideaSlug)

  return { ok: true, data: { prUrl: prUrl ?? '' } }
}
