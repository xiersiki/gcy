type WorkIndexItem = {
  id: string
  authorId: string
  slug: string
  title: string
  summary: string
  type: string
  date: string
  tags?: string[]
  category?: string
  cover?: string
  draft?: boolean
  demo?: unknown
  idea?: Record<string, unknown>
  sourceIdeaId?: string
  external?: Record<string, unknown>
}

function decodeBase64ToUtf8(base64: string) {
  const normalized = base64.replace(/\n/g, '')
  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
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

function parseBranch(branch: string) {
  if (!branch.startsWith('ideas/')) return null
  const parts = branch.split('/')
  if (parts.length !== 3) return null
  const [, authorId, slug] = parts
  if (!authorId || !slug) return null
  if (!/^[a-z0-9-]+$/i.test(authorId) || !/^[a-z0-9-]+$/i.test(slug)) return null
  return { authorId, slug }
}

export const onRequestGet = async ({ env }: { env: Record<string, unknown> }) => {
  try {
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
    if (!owner || !repo || !token) return new Response(JSON.stringify([]), { status: 200 })

    const refsRes = await gh(
      `/repos/${owner}/${repo}/git/matching-refs/heads/ideas/`,
      { method: 'GET' },
      token,
    )
    if (!refsRes.ok) {
      const raw = await refsRes.text().catch(() => '')
      throw new Error(`读取分支列表失败：${refsRes.status} ${raw.slice(0, 200)}`)
    }
    const refs = (await refsRes.json().catch(() => [])) as Array<{ ref?: string }>
    const branches = refs
      .map((r) => String(r.ref || ''))
      .filter(Boolean)
      .map((ref) => (ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref))

    const { default: YAML } = await import('yaml')
    const items: WorkIndexItem[] = []

    for (const branch of branches) {
      const parsed = parseBranch(branch)
      if (!parsed) continue
      const { authorId, slug } = parsed
      const metaPath = `content/works/${authorId}/${slug}/meta.yml`
      const metaRes = await gh(
        `/repos/${owner}/${repo}/contents/${metaPath}?ref=${encodeURIComponent(branch)}`,
        { method: 'GET' },
        token,
      )
      if (!metaRes.ok) continue
      const metaJson = (await metaRes.json()) as { content: string }
      const metaRaw = decodeBase64ToUtf8(metaJson.content)
      const meta = (YAML.parse(metaRaw) ?? {}) as Record<string, unknown>
      if (meta.type !== 'idea') continue

      const compareUrl = `https://github.com/${owner}/${repo}/compare/${base}...${branch}?expand=1`
      const idea = (meta.idea as Record<string, unknown> | undefined) ?? {}
      meta.idea = { ...idea, branch, compareUrl, pending: true }

      items.push({
        id: `${authorId}/${slug}`,
        authorId,
        slug,
        ...(meta as unknown as Omit<WorkIndexItem, 'id' | 'authorId' | 'slug'>),
      })
    }

    items.sort((a, b) => b.date.localeCompare(a.date))

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '加载失败'
    return new Response(message, { status: 500 })
  }
}
