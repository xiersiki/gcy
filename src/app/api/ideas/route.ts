export const dynamic = 'force-dynamic'
export const runtime = 'edge'

type Payload = {
  authorId: string
  title: string
  summary: string
  details?: string
  tags?: string[]
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
  return slug || 'idea'
}

function ensureSafeId(id: string) {
  const s = id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!s) throw new Error('无效的 authorId')
  return s
}

function toIsoDate() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function b64(u8: Uint8Array) {
  let s = ''
  for (let i = 0; i < u8.length; i += 1) s += String.fromCharCode(u8[i])
  return btoa(s)
}

async function readPayloadAndImages(req: Request): Promise<{ payload: Payload; images: File[] }> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData()
    const raw = String(fd.get('payload') || '')
    const payload = JSON.parse(raw || '{}') as Payload
    const images: File[] = []
    const files = fd.getAll('images')
    for (const f of files) {
      if (f instanceof File) images.push(f)
    }
    return { payload, images }
  }
  const payload = (await req.json().catch(() => null)) as Payload | null
  if (!payload) throw new Error('缺少有效 payload')
  return { payload, images: [] }
}

function buildMetaYaml(p: Payload, authorId: string, slug: string) {
  const tags = (p.tags ?? []).filter((t) => t && t.trim()).slice(0, 12)
  const lines = []
  lines.push(`title: ${p.title}`)
  lines.push(`summary: ${p.summary}`)
  lines.push(`type: idea`)
  lines.push(`date: ${toIsoDate()}`)
  if (tags.length) {
    lines.push(`tags:`)
    for (const t of tags) lines.push(`  - ${t}`)
  }
  lines.push(`demo:`)
  lines.push(`  kind: iframe`)
  lines.push(`  src: /demos/${authorId}/${slug}/`)
  lines.push(`  devSrc: http://localhost:5173/`)
  lines.push(`  height: 720`)
  return `${lines.join('\n')}\n`
}

function buildIndexMdx(p: Payload, authorId: string, slug: string, imageNames: string[]) {
  const lines = []
  lines.push(`# ${p.title}`)
  lines.push('')
  lines.push(p.details && p.details.trim() ? p.details.trim() : p.summary)
  lines.push('')
  if (imageNames.length) {
    lines.push('## 参考图片')
    lines.push('')
    for (const name of imageNames) {
      lines.push(`![${p.title}](/content/works/${authorId}/${slug}/assets/${name})`)
    }
    lines.push('')
  }
  return `${lines.join('\n')}\n`
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
  const r = await fetch(`https://api.github.com${url}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...(init.headers || {}),
    } as Record<string, string>,
  })
  return r
}

export async function POST(req: Request) {
  try {
    const { payload, images } = await readPayloadAndImages(req)
    const owner = process.env.GITHUB_OWNER || ''
    const repo = process.env.GITHUB_REPO || ''
    const token = process.env.GITHUB_TOKEN || ''
    if (!owner || !repo || !token) {
      const branchPreview = `ideas/${ensureSafeId(payload.authorId)}/${slugifyTitle(payload.title)}`
      const compare = `https://github.com/${owner || 'owner'}/${repo || 'repo'}/compare/${branchPreview}?expand=1`
      return new Response(JSON.stringify({ prUrl: compare }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const authorId = ensureSafeId(payload.authorId)
    const slug = slugifyTitle(payload.title)
    const branch = `ideas/${authorId}/${slug}`
    const base = 'main'

    const refRes = await gh(
      `/repos/${owner}/${repo}/git/refs/heads/${base}`,
      { method: 'GET' },
      token,
    )
    if (!refRes.ok) {
      const raw = await refRes.text().catch(() => '')
      throw new Error(`获取基准分支失败：${refRes.status} ${raw.slice(0, 200)}`)
    }
    const refData = (await refRes.json()) as { object: { sha: string } }
    const baseCommitSha = refData.object.sha

    const commitRes = await gh(
      `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
      { method: 'GET' },
      token,
    )
    if (!commitRes.ok) {
      const raw = await commitRes.text().catch(() => '')
      throw new Error(`获取提交信息失败：${commitRes.status} ${raw.slice(0, 200)}`)
    }
    const commitData = (await commitRes.json()) as { tree: { sha: string } }
    const baseTreeSha = commitData.tree.sha

    const maxImageBytes = 5 * 1024 * 1024
    const imageFiles = images
      .filter((f) => f.size <= maxImageBytes)
      .slice(0, 6)
      .map((f) => ({ name: f.name.replace(/[^a-z0-9_.-]/gi, ''), file: f }))

    const imageEntries: { path: string; mode: string; type: string; sha: string }[] = []
    for (const it of imageFiles) {
      const buf = new Uint8Array(await it.file.arrayBuffer())
      const blobRes = await gh(
        `/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({ content: b64(buf), encoding: 'base64' }),
        },
        token,
      )
      if (!blobRes.ok) {
        const raw = await blobRes.text().catch(() => '')
        throw new Error(`创建图片 Blob 失败：${blobRes.status} ${raw.slice(0, 200)}`)
      }
      const blobData = (await blobRes.json()) as { sha: string }
      imageEntries.push({
        path: `content/works/${authorId}/${slug}/assets/${it.name}`,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      })
    }

    const meta = buildMetaYaml(payload, authorId, slug)
    const mdx = buildIndexMdx(
      payload,
      authorId,
      slug,
      imageFiles.map((it) => it.name),
    )

    const treeBody = {
      base_tree: baseTreeSha,
      tree: [
        {
          path: `content/works/${authorId}/${slug}/meta.yml`,
          mode: '100644',
          type: 'blob',
          content: meta,
        },
        {
          path: `content/works/${authorId}/${slug}/index.mdx`,
          mode: '100644',
          type: 'blob',
          content: mdx,
        },
        ...imageEntries,
        {
          path: `demos/${authorId}/${slug}/package.json`,
          mode: '100644',
          type: 'blob',
          content: demoPackageJson(authorId, slug),
        },
        {
          path: `demos/${authorId}/${slug}/vite.config.js`,
          mode: '100644',
          type: 'blob',
          content: demoViteConfig(),
        },
        {
          path: `demos/${authorId}/${slug}/index.html`,
          mode: '100644',
          type: 'blob',
          content: demoIndexHtml(payload.title),
        },
        {
          path: `demos/${authorId}/${slug}/src/main.jsx`,
          mode: '100644',
          type: 'blob',
          content: demoMainJsx(),
        },
        {
          path: `demos/${authorId}/${slug}/src/App.jsx`,
          mode: '100644',
          type: 'blob',
          content: demoAppJsx(),
        },
      ],
    }

    const treeRes = await gh(
      `/repos/${owner}/${repo}/git/trees`,
      { method: 'POST', body: JSON.stringify(treeBody) },
      token,
    )
    if (!treeRes.ok) {
      const raw = await treeRes.text().catch(() => '')
      throw new Error(`创建树失败：${treeRes.status} ${raw.slice(0, 200)}`)
    }
    const treeData = (await treeRes.json()) as { sha: string }

    const message = `feat(ideas): ${authorId}/${slug} · ${payload.title}`
    const newCommitRes = await gh(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
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
      throw new Error(`创建分支失败：${refCreateRes.status} ${raw.slice(0, 200)}`)
    }

    const prRes = await gh(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: `${payload.title}`,
          head: branch,
          base,
          body:
            payload.details && payload.details.trim() ? payload.details.trim() : payload.summary,
        }),
      },
      token,
    )
    if (!prRes.ok) {
      const raw = await prRes.text().catch(() => '')
      throw new Error(`创建 PR 失败：${prRes.status} ${raw.slice(0, 200)}`)
    }
    const prData = (await prRes.json()) as { html_url: string }

    return new Response(JSON.stringify({ prUrl: prData.html_url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交失败'
    return new Response(message, { status: 500 })
  }
}
