type Payload = {
  ideaId: string
  implementAuthorId: string
  workType: 'demo' | 'case-study'
  title?: string
}

function ensureSafeIdeaId(id: string) {
  const trimmed = id.trim()
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/i.test(trimmed)) throw new Error('无效的 ideaId')
  return trimmed
}

function ensureSafeId(id: string) {
  const s = id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!s) throw new Error('无效的 authorId')
  return s
}

function slugifyTitle(title: string) {
  const normalized = title
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'work'
}

function toIsoDate() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function decodeBase64ToUtf8(base64: string) {
  const normalized = base64.replace(/\n/g, '')
  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

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

function demoIndexHtml(title: string) {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${title}</title>`,
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
    '  const [boxHeight, setBoxHeight] = useState(180)',
    '  useEffect(() => {',
    '    if (typeof onChange === "function") onChange()',
    '  }, [count, boxHeight, onChange])',
    '',
    '  return (',
    '    <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>',
    '      <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 16, maxWidth: 720, margin: "0 auto" }}>',
    '        <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>React Demo（独立包 + iframe 隔离）</h1>',
    '        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>',
    '          <button type="button" onClick={() => setCount((v) => v - 1)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", background: "transparent", cursor: "pointer" }}>-1</button>',
    '          <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 24 }}>{count}</div>',
    '          <button type="button" onClick={() => setCount((v) => v + 1)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", background: "transparent", cursor: "pointer" }}>+1</button>',
    '        </div>',
    '        <div style={{ height: 12 }} />',
    '        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>',
    '          <label htmlFor="range">渐变块高度</label>',
    '          <input id="range" type="range" min="120" max="520" value={boxHeight} onChange={(e) => setBoxHeight(Number(e.target.value))} />',
    '          <span style={{ opacity: 0.72, fontSize: 12 }}>{boxHeight}px</span>',
    '        </div>',
    '        <div style={{ height: 12 }} />',
    '        <div style={{ height: boxHeight, width: "100%", borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }} />',
    '        <div style={{ height: 12 }} />',
    '        <div style={{ opacity: 0.72, fontSize: 12 }}>这个 demo 会向父页面 postMessage 高度用于自适应。</div>',
    '      </div>',
    '    </div>',
    '  )',
    '}',
    '',
  ].join('\n')
}

async function gh(url: string, init: RequestInit, token: string) {
  return fetch(`https://api.github.com${url}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...(init.headers || {}),
    } as Record<string, string>,
  })
}

async function checkExists(owner: string, repo: string, token: string, path: string, ref: string) {
  const r = await gh(
    `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    { method: 'GET' },
    token,
  )
  if (r.status === 404) return false
  return r.ok
}

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request
  env: Record<string, unknown>
}) => {
  try {
    const body = (await request.json().catch(() => null)) as Payload | null
    if (!body) throw new Error('缺少有效 payload')

    const e = env as {
      GITHUB_OWNER?: string
      GITHUB_REPO?: string
      GITHUB_TOKEN?: string
      GITHUB_BASE?: string
    }
    const owner = e.GITHUB_OWNER || process.env.GITHUB_OWNER || ''
    const repo = e.GITHUB_REPO || process.env.GITHUB_REPO || ''
    const token = e.GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
    const base = e.GITHUB_BASE || process.env.GITHUB_BASE || 'main'
    if (!owner || !repo || !token) throw new Error('缺少 GitHub 配置')

    const ideaId = ensureSafeIdeaId(body.ideaId)
    const implementAuthorId = ensureSafeId(body.implementAuthorId)
    const workType = body.workType === 'case-study' ? 'case-study' : 'demo'
    const [ideaAuthorId, ideaSlug] = ideaId.split('/') as [string, string]

    const ideaMetaPath = `content/works/${ideaAuthorId}/${ideaSlug}/meta.yml`
    const ideaMdxPath = `content/works/${ideaAuthorId}/${ideaSlug}/index.mdx`

    const refRes = await gh(
      `/repos/${owner}/${repo}/git/refs/heads/${base}`,
      { method: 'GET' },
      token,
    )
    if (!refRes.ok) throw new Error(`获取基准分支失败：${refRes.status}`)
    const refData = (await refRes.json()) as { object: { sha: string } }
    const baseCommitSha = refData.object.sha

    const commitRes = await gh(
      `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
      { method: 'GET' },
      token,
    )
    if (!commitRes.ok) throw new Error(`获取提交信息失败：${commitRes.status}`)
    const commitData = (await commitRes.json()) as { tree: { sha: string } }
    const baseTreeSha = commitData.tree.sha

    const ideaMetaRes = await gh(
      `/repos/${owner}/${repo}/contents/${ideaMetaPath}?ref=${encodeURIComponent(base)}`,
      { method: 'GET' },
      token,
    )
    if (!ideaMetaRes.ok) {
      const raw = await ideaMetaRes.text().catch(() => '')
      throw new Error(`读取 idea meta.yml 失败：${ideaMetaRes.status} ${raw.slice(0, 120)}`)
    }
    const ideaMetaJson = (await ideaMetaRes.json()) as { content: string }
    const ideaMetaRaw = decodeBase64ToUtf8(ideaMetaJson.content)
    const { default: YAML } = await import('yaml')
    const ideaMeta = (YAML.parse(ideaMetaRaw) ?? {}) as Record<string, unknown>
    const existingIdea = ((ideaMeta.idea as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >
    const existingStatus = String(existingIdea.status ?? 'open')
    if (existingStatus === 'done') throw new Error('该点子已实现，无需重复提交')

    const ideaMdxRes = await gh(
      `/repos/${owner}/${repo}/contents/${ideaMdxPath}?ref=${encodeURIComponent(base)}`,
      { method: 'GET' },
      token,
    )
    if (!ideaMdxRes.ok) {
      const raw = await ideaMdxRes.text().catch(() => '')
      throw new Error(`读取 idea index.mdx 失败：${ideaMdxRes.status} ${raw.slice(0, 120)}`)
    }
    const ideaMdxJson = (await ideaMdxRes.json()) as { content: string }
    const ideaMdxRaw = decodeBase64ToUtf8(ideaMdxJson.content)

    const title = (body.title && body.title.trim()) || String(ideaMeta.title || '').trim() || ideaId
    let slug = slugifyTitle(title)
    for (let i = 2; i <= 9; i += 1) {
      const candidateMeta = `content/works/${implementAuthorId}/${slug}/meta.yml`
      if (!(await checkExists(owner, repo, token, candidateMeta, base))) break
      slug = `${slugifyTitle(title)}-${i}`
    }

    const workId = `${implementAuthorId}/${slug}`
    const workMetaPath = `content/works/${implementAuthorId}/${slug}/meta.yml`
    const workMdxPath = `content/works/${implementAuthorId}/${slug}/index.mdx`

    const nextWorkMeta = {
      title,
      summary:
        String(ideaMeta.summary || '').trim() || String(ideaMeta.title || '').trim() || title,
      type: workType,
      date: toIsoDate(),
      tags: Array.isArray(ideaMeta.tags) ? ideaMeta.tags : undefined,
      demo: {
        kind: 'iframe',
        src: `/demos/${implementAuthorId}/${slug}/`,
        devSrc: 'http://localhost:5173/',
        height: 720,
      },
      sourceIdeaId: ideaId,
    }

    const nextWorkMdx = [
      `# ${title}`,
      ``,
      `来源点子：[/works/${ideaAuthorId}/${ideaSlug}](/works/${ideaAuthorId}/${ideaSlug})`,
      ``,
      `## 实现说明`,
      ``,
      `- 请在这里补充实现细节与使用方式。`,
      ``,
      `---`,
      ``,
      `## 原点子内容`,
      ``,
      ideaMdxRaw.trim(),
      ``,
    ].join('\n')

    existingIdea.status = 'done'
    existingIdea.implementedWorkId = workId
    ideaMeta.idea = existingIdea

    const branch = `ideas/complete/${implementAuthorId}/${ideaAuthorId}-${ideaSlug}`

    const treeRes = await gh(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: [
            {
              path: ideaMetaPath,
              mode: '100644',
              type: 'blob',
              content: `${YAML.stringify(ideaMeta)}`,
            },
            {
              path: workMetaPath,
              mode: '100644',
              type: 'blob',
              content: `${YAML.stringify(nextWorkMeta)}`,
            },
            {
              path: workMdxPath,
              mode: '100644',
              type: 'blob',
              content: `${nextWorkMdx}\n`,
            },
            {
              path: `demos/${implementAuthorId}/${slug}/package.json`,
              mode: '100644',
              type: 'blob',
              content: demoPackageJson(implementAuthorId, slug),
            },
            {
              path: `demos/${implementAuthorId}/${slug}/vite.config.js`,
              mode: '100644',
              type: 'blob',
              content: demoViteConfig(),
            },
            {
              path: `demos/${implementAuthorId}/${slug}/index.html`,
              mode: '100644',
              type: 'blob',
              content: demoIndexHtml(title),
            },
            {
              path: `demos/${implementAuthorId}/${slug}/src/main.jsx`,
              mode: '100644',
              type: 'blob',
              content: demoMainJsx(),
            },
            {
              path: `demos/${implementAuthorId}/${slug}/src/App.jsx`,
              mode: '100644',
              type: 'blob',
              content: demoAppJsx(),
            },
          ],
        }),
      },
      token,
    )
    if (!treeRes.ok) {
      const raw = await treeRes.text().catch(() => '')
      throw new Error(`创建树失败：${treeRes.status} ${raw.slice(0, 200)}`)
    }
    const treeData = (await treeRes.json()) as { sha: string }

    const newCommitRes = await gh(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: `feat(${workType}): ${workId} implements ${ideaId}`,
          tree: treeData.sha,
          parents: [baseCommitSha],
        }),
      },
      token,
    )
    if (!newCommitRes.ok) {
      const raw = await newCommitRes.text().catch(() => '')
      throw new Error(`创建提交失败：${newCommitRes.status} ${raw.slice(0, 200)}`)
    }
    const newCommitData = (await newCommitRes.json()) as { sha: string }

    const refCreateRes = await gh(
      `/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: newCommitData.sha,
        }),
      },
      token,
    )
    if (!refCreateRes.ok) {
      const raw = await refCreateRes.text().catch(() => '')
      if (refCreateRes.status === 422 && raw.includes('Reference already exists')) {
        const updateRes = await gh(
          `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
          { method: 'PATCH', body: JSON.stringify({ sha: newCommitData.sha, force: true }) },
          token,
        )
        if (!updateRes.ok) {
          const updateRaw = await updateRes.text().catch(() => '')
          throw new Error(`更新分支失败：${updateRes.status} ${updateRaw.slice(0, 200)}`)
        }
      } else {
        throw new Error(`创建分支失败：${refCreateRes.status} ${raw.slice(0, 200)}`)
      }
    }

    const prRes = await gh(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: `${title}（实现：${ideaId}）`,
          head: branch,
          base,
          body: `Implements idea: ${ideaId}\n\nWork: ${workId}`,
        }),
      },
      token,
    )
    let prUrl: string | null = null
    if (prRes.ok) {
      const prData = (await prRes.json()) as { html_url: string }
      prUrl = prData.html_url
    } else {
      const raw = await prRes.text().catch(() => '')
      if (prRes.status === 422 && raw.toLowerCase().includes('already exists')) {
        const listRes = await gh(
          `/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${branch}`)}&state=open`,
          { method: 'GET' },
          token,
        )
        if (listRes.ok) {
          const list = (await listRes.json().catch(() => [])) as Array<{ html_url?: string }>
          prUrl = list[0]?.html_url ?? null
        }
      }
      if (!prUrl) throw new Error(`创建 PR 失败：${prRes.status} ${raw.slice(0, 200)}`)
    }

    return new Response(JSON.stringify({ prUrl }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败'
    return new Response(message, { status: 500 })
  }
}
