export type GitHubClient = {
  owner: string
  repo: string
  base: string
  request: (path: string, init: RequestInit) => Promise<Response>
}

export function createGitHubClient() {
  const owner = process.env.GITHUB_OWNER || ''
  const repo = process.env.GITHUB_REPO || ''
  const token = process.env.GITHUB_TOKEN || ''
  const base = process.env.GITHUB_BASE || 'main'
  if (!owner || !repo || !token) throw new Error('Missing GitHub env')

  const request = (path: string, init: RequestInit) =>
    fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        ...(init.headers || {}),
      } as Record<string, string>,
    })

  return { owner, repo, base, request } satisfies GitHubClient
}

export async function githubRequest(
  client: GitHubClient,
  path: string,
  init: RequestInit,
  opts?: { retries?: number },
) {
  const retries = Math.max(0, opts?.retries ?? 2)
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await client.request(path, init)
      if (res.status === 429 || res.status >= 500) {
        const retryAfterHeader = res.headers.get('retry-after')
        const waitMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 300 * (attempt + 1)
        await new Promise((r) => setTimeout(r, Math.min(1500, Math.max(150, waitMs))))
        continue
      }
      return res
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error('GitHub request failed')
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)))
    }
  }
  throw lastErr ?? new Error('GitHub request failed')
}
