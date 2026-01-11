type Payload = {
  branch: string
  claimedBy: string
}

function ensureSafeBranch(branch: string) {
  const trimmed = branch.trim()
  if (!/^ideas\/[a-z0-9-]+\/[a-z0-9-]+$/i.test(trimmed)) throw new Error('无效的分支名')
  return trimmed
}

function ensureSafeGitHubUser(v: string) {
  const s = v.trim()
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(s)) throw new Error('无效的 GitHub 用户名')
  return s
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

    const branch = ensureSafeBranch(body.branch)
    const claimedBy = ensureSafeGitHubUser(body.claimedBy)
    const [, ideaAuthorId, ideaSlug] = branch.split('/') as [string, string, string]

    const metaPath = `content/works/${ideaAuthorId}/${ideaSlug}/meta.yml`

    const refRes = await gh(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { method: 'GET' },
      token,
    )
    if (!refRes.ok) throw new Error(`获取分支失败：${refRes.status}`)
    const refData = (await refRes.json()) as { object: { sha: string } }
    const branchCommitSha = refData.object.sha

    const commitRes = await gh(
      `/repos/${owner}/${repo}/git/commits/${branchCommitSha}`,
      { method: 'GET' },
      token,
    )
    if (!commitRes.ok) throw new Error(`获取提交信息失败：${commitRes.status}`)
    const commitData = (await commitRes.json()) as { tree: { sha: string } }
    const baseTreeSha = commitData.tree.sha

    const metaRes = await gh(
      `/repos/${owner}/${repo}/contents/${metaPath}?ref=${encodeURIComponent(branch)}`,
      { method: 'GET' },
      token,
    )
    if (!metaRes.ok) {
      const raw = await metaRes.text().catch(() => '')
      throw new Error(`读取 meta.yml 失败：${metaRes.status} ${raw.slice(0, 120)}`)
    }
    const metaJson = (await metaRes.json()) as { content: string }
    const metaRaw = decodeBase64ToUtf8(metaJson.content)
    const { default: YAML } = await import('yaml')
    const meta = (YAML.parse(metaRaw) ?? {}) as Record<string, unknown>

    const idea = ((meta.idea as Record<string, unknown> | undefined) ?? {}) as Record<
      string,
      unknown
    >
    const existingStatus = String(idea.status ?? 'open')
    const existingClaimedBy = typeof idea.claimedBy === 'string' ? idea.claimedBy.trim() : ''
    if (existingStatus === 'done') throw new Error('该点子已实现，无法认领')
    if (existingStatus === 'in-progress' && existingClaimedBy && existingClaimedBy !== claimedBy) {
      throw new Error(`该点子已被 ${existingClaimedBy} 认领`)
    }
    idea.status = 'in-progress'
    idea.claimedBy = claimedBy
    idea.claimedAt = toIsoDate()
    meta.idea = idea

    const updatedMeta = `${YAML.stringify(meta)}`

    const treeRes = await gh(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: [
            {
              path: metaPath,
              mode: '100644',
              type: 'blob',
              content: updatedMeta,
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
          message: `chore(ideas): claim ${ideaAuthorId}/${ideaSlug} by ${claimedBy}`,
          tree: treeData.sha,
          parents: [branchCommitSha],
        }),
      },
      token,
    )
    if (!newCommitRes.ok) {
      const raw = await newCommitRes.text().catch(() => '')
      throw new Error(`创建提交失败：${newCommitRes.status} ${raw.slice(0, 200)}`)
    }
    const newCommitData = (await newCommitRes.json()) as { sha: string }

    const updateRes = await gh(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { method: 'PATCH', body: JSON.stringify({ sha: newCommitData.sha, force: true }) },
      token,
    )
    if (!updateRes.ok) {
      const updateRaw = await updateRes.text().catch(() => '')
      throw new Error(`更新分支失败：${updateRes.status} ${updateRaw.slice(0, 200)}`)
    }

    const prRes = await gh(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: `claim: ${ideaAuthorId}/${ideaSlug} by ${claimedBy}`,
          head: branch,
          base,
          body: `Claimed by ${claimedBy}\n\nIdea: /works/${ideaAuthorId}/${ideaSlug}`,
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
    const message = err instanceof Error ? err.message : '认领失败'
    return new Response(message, { status: 500 })
  }
}
