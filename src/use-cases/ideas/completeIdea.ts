import { z } from 'zod'
import YAML from 'yaml'

import { slugifyTitle } from '@/shared/slug'
import { ensureSafeId } from '@/shared/id'
import { ApiErrorCode } from '@/server/api/errors'
import type { GitHubClient } from '@/server/github/client'
import type { UseCaseResult } from '../types'

export const CompleteIdeaInputSchema = z.object({
  ideaId: z.string(),
  implementAuthorId: z.string(),
  workType: z.enum(['demo', 'case-study']),
  title: z.string().optional(),
})

export type CompleteIdeaInput = z.infer<typeof CompleteIdeaInputSchema>
export type CompleteIdeaOutput = { prUrl: string }

export type CompleteIdeaDeps = {
  ghClient: GitHubClient
  githubRequest: (
    client: GitHubClient,
    path: string,
    init: RequestInit,
    opts?: { retries?: number },
  ) => Promise<Response>
  now: () => Date
}

export async function completeIdea(
  input: CompleteIdeaInput,
  deps: CompleteIdeaDeps,
): Promise<UseCaseResult<CompleteIdeaOutput, ApiErrorCode>> {
  const parsed = CompleteIdeaInputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: { code: ApiErrorCode.BadRequest, message: '缺少有效 payload', status: 400 },
    }

  const ideaId = ensureSafeIdeaId(parsed.data.ideaId)
  const implementAuthorId = ensureSafeId(parsed.data.implementAuthorId, 'implementAuthorId')
  const workType = parsed.data.workType === 'case-study' ? 'case-study' : 'demo'
  const [ideaAuthorId, ideaSlug] = ideaId.split('/') as [string, string]

  const { owner, repo, base } = deps.ghClient

  const ideaMetaPath = `content/works/${ideaAuthorId}/${ideaSlug}/meta.yml`
  const ideaMdxPath = `content/works/${ideaAuthorId}/${ideaSlug}/index.mdx`

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

  const ideaMetaRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/contents/${ideaMetaPath}?ref=${encodeURIComponent(base)}`,
    { method: 'GET' },
  )
  if (!ideaMetaRes.ok) {
    const raw = await ideaMetaRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `读取 idea meta.yml 失败：${ideaMetaRes.status} ${raw.slice(0, 120)}`,
        status: 500,
      },
    }
  }
  const ideaMetaJson = (await ideaMetaRes.json()) as { content: string }
  const ideaMetaRaw = decodeBase64ToUtf8(ideaMetaJson.content)
  const ideaMeta = (YAML.parse(ideaMetaRaw) ?? {}) as Record<string, unknown>

  const existingIdea = ((ideaMeta.idea as Record<string, unknown> | undefined) ?? {}) as Record<
    string,
    unknown
  >
  const existingStatus = String(existingIdea.status ?? 'open')
  if (existingStatus === 'done')
    return {
      ok: false,
      error: { code: ApiErrorCode.Conflict, message: '该点子已实现，无需重复提交', status: 409 },
    }

  const ideaMdxRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/contents/${ideaMdxPath}?ref=${encodeURIComponent(base)}`,
    { method: 'GET' },
  )
  if (!ideaMdxRes.ok) {
    const raw = await ideaMdxRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `读取 idea index.mdx 失败：${ideaMdxRes.status} ${raw.slice(0, 120)}`,
        status: 500,
      },
    }
  }
  const ideaMdxJson = (await ideaMdxRes.json()) as { content: string }
  const ideaMdxRaw = decodeBase64ToUtf8(ideaMdxJson.content)

  const title =
    (parsed.data.title && parsed.data.title.trim()) || String(ideaMeta.title || '').trim() || ideaId
  let slug = slugifyTitle(title, { fallback: 'work' })
  for (let i = 2; i <= 9; i += 1) {
    const candidateMeta = `content/works/${implementAuthorId}/${slug}/meta.yml`
    if (!(await checkExists(deps, candidateMeta, base))) break
    slug = `${slugifyTitle(title, { fallback: 'work' })}-${i}`
  }

  const workId = `${implementAuthorId}/${slug}`
  const workMetaPath = `content/works/${implementAuthorId}/${slug}/meta.yml`
  const workMdxPath = `content/works/${implementAuthorId}/${slug}/index.mdx`

  const nextWorkMeta = {
    title,
    summary: String(ideaMeta.summary || '').trim() || String(ideaMeta.title || '').trim() || title,
    type: workType,
    date: toIsoDate(deps.now()),
    tags: Array.isArray(ideaMeta.tags) ? ideaMeta.tags : undefined,
    demo: {
      kind: 'iframe',
      src: `/demos/${implementAuthorId}/${slug}/index.html`,
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

  const treeRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/git/trees`, {
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
        { path: workMdxPath, mode: '100644', type: 'blob', content: `${nextWorkMdx}\n` },
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
  })
  if (!treeRes.ok) {
    const raw = await treeRes.text().catch(() => '')
    return {
      ok: false,
      error: {
        code: ApiErrorCode.GitHubError,
        message: `创建树失败：${treeRes.status} ${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const treeData = (await treeRes.json()) as { sha: string }

  const newCommitRes = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: `feat(${workType}): ${workId} implements ${ideaId}`,
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
        message: `创建提交失败：${newCommitRes.status} ${raw.slice(0, 200)}`,
        status: 500,
      },
    }
  }
  const newCommitData = (await newCommitRes.json()) as { sha: string }

  const refCreateRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitData.sha }),
  })
  if (!refCreateRes.ok) {
    const raw = await refCreateRes.text().catch(() => '')
    if (refCreateRes.status === 422 && raw.includes('Reference already exists')) {
      const updateRes = await deps.githubRequest(
        deps.ghClient,
        `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
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
            message: `更新分支失败：${updateRes.status} ${updateRaw.slice(0, 200)}`,
            status: 500,
          },
        }
      }
    } else {
      return {
        ok: false,
        error: {
          code: ApiErrorCode.GitHubError,
          message: `创建分支失败：${refCreateRes.status} ${raw.slice(0, 200)}`,
          status: 500,
        },
      }
    }
  }

  const prRes = await deps.githubRequest(deps.ghClient, `/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `${title}（实现：${ideaId}）`,
      head: branch,
      base,
      body: `Implements idea: ${ideaId}\n\nWork: ${workId}`,
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
        `/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${branch}`)}&state=open`,
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
          message: `创建 PR 失败：${prRes.status} ${raw.slice(0, 200)}`,
          status: 500,
        },
      }
  }

  return { ok: true, data: { prUrl: prUrl ?? '' } }
}

function ensureSafeIdeaId(id: string) {
  const trimmed = id.trim()
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/i.test(trimmed)) throw new Error('无效的 ideaId')
  return trimmed
}

function toIsoDate(d: Date) {
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

async function checkExists(deps: CompleteIdeaDeps, path: string, ref: string) {
  const { owner, repo } = deps.ghClient
  const r = await deps.githubRequest(
    deps.ghClient,
    `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    { method: 'GET' },
  )
  if (r.status === 404) return false
  return r.ok
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
