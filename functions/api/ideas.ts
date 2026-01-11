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

async function readPayloadAndImages(
  request: Request,
): Promise<{ payload: Payload; images: File[] }> {
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData()
    const raw = String(fd.get('payload') || '')
    const payload = JSON.parse(raw || '{}') as Payload
    const images: File[] = []
    const files = fd.getAll('images')
    for (const f of files) {
      if (f instanceof File) images.push(f)
    }
    return { payload, images }
  }
  const payload = (await request.json().catch(() => null)) as Payload | null
  if (!payload) throw new Error('缺少有效 payload')
  return { payload, images: [] }
}

function buildMetaYaml(p: Payload) {
  const tags = (p.tags ?? []).filter((t) => t && t.trim()).slice(0, 12)
  const lines = []
  lines.push(`title: ${p.title}`)
  lines.push(`summary: ${p.summary}`)
  lines.push(`type: idea`)
  lines.push(`date: ${toIsoDate()}`)
  lines.push(`idea:`)
  lines.push(`  status: open`)
  if (tags.length) {
    lines.push(`tags:`)
    for (const t of tags) lines.push(`  - ${t}`)
  }
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

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request
  env: Record<string, unknown>
}) => {
  try {
    const { payload, images } = await readPayloadAndImages(request)
    const e = env as { GITHUB_OWNER?: string; GITHUB_REPO?: string; GITHUB_TOKEN?: string }
    const owner = e.GITHUB_OWNER || process.env.GITHUB_OWNER || ''
    const repo = e.GITHUB_REPO || process.env.GITHUB_REPO || ''
    const token = e.GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
    if (!owner || !repo || !token) {
      const branchPreview = `ideas/${ensureSafeId(payload.authorId)}/${slugifyTitle(payload.title)}`
      const compareUrl = `https://github.com/${owner || 'owner'}/${repo || 'repo'}/compare/main...${branchPreview}?expand=1`
      return new Response(JSON.stringify({ branch: branchPreview, compareUrl }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const authorId = ensureSafeId(payload.authorId)
    const slug = slugifyTitle(payload.title)
    const branch = `ideas/${authorId}/${slug}`
    const base = (env as { GITHUB_BASE?: string }).GITHUB_BASE || process.env.GITHUB_BASE || 'main'

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

    const meta = buildMetaYaml(payload)
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

    const compareUrl = `https://github.com/${owner}/${repo}/compare/${base}...${branch}?expand=1`
    return new Response(JSON.stringify({ branch, compareUrl }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交失败'
    return new Response(message, { status: 500 })
  }
}
