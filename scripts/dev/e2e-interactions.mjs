import httpClient from 'node:http'
import httpsClient from 'node:https'

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000'
const email = process.env.E2E_EMAIL || `e2e+${Date.now()}@example.com`
const password = process.env.E2E_PASSWORD || '123456'
const workAuthorId = process.env.E2E_WORK_AUTHOR_ID || 'gcy'
const workSlug = process.env.E2E_WORK_SLUG || 'demo2'

function assertOk(condition, message) {
  if (!condition) throw new Error(message)
}

function parseSetCookie(setCookie) {
  const raw = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  const pairs = []
  for (const line of raw) {
    const first = String(line).split(';')[0]
    const idx = first.indexOf('=')
    if (idx <= 0) continue
    const name = first.slice(0, idx)
    const value = first.slice(idx + 1)
    pairs.push({ name, value })
  }
  return pairs
}

class CookieJar {
  #map = new Map()

  addFromResponseHeaders(headers) {
    const setCookie = headers['set-cookie']
    for (const { name, value } of parseSetCookie(setCookie)) {
      this.#map.set(name, value)
    }
  }

  headerValue() {
    return Array.from(this.#map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  }
}

async function requestRaw(method, path, { jar, headers, body } = {}) {
  const url = new URL(path, baseUrl)
  const h = { ...(headers || {}) }
  if (jar) {
    const cookie = jar.headerValue()
    if (cookie) h.cookie = cookie
  }

  const isHttps = url.protocol === 'https:'
  const client = isHttps ? httpsClient : httpClient

  const { statusCode, text } = await new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method,
        headers: h,
      },
      (res) => {
        if (jar) jar.addFromResponseHeaders(res.headers)
        const chunks = []
        res.on('data', (d) => chunks.push(d))
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode || 0,
            text: Buffer.concat(chunks).toString('utf8'),
          }),
        )
      },
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })

  return { statusCode, text }
}

async function postForm(path, values, jar) {
  const body = new URLSearchParams(values).toString()
  return requestRaw('POST', path, {
    jar,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
}

async function getJson(path, jar) {
  const res = await requestRaw('GET', path, { jar })
  assertOk(res.statusCode === 200, `GET ${path} failed: ${res.statusCode} ${res.text}`)
  return JSON.parse(res.text)
}

async function postJson(path, payload, jar) {
  const res = await requestRaw('POST', path, {
    jar,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  assertOk(res.statusCode === 200, `POST ${path} failed: ${res.statusCode} ${res.text}`)
  return JSON.parse(res.text)
}

async function delJson(path, jar) {
  const res = await requestRaw('DELETE', path, { jar })
  assertOk(res.statusCode === 200, `DELETE ${path} failed: ${res.statusCode} ${res.text}`)
  return JSON.parse(res.text)
}

async function main() {
  const jar = new CookieJar()

  const signup = await postForm('/auth/password/signup', { email, password }, jar)
  assertOk(signup.statusCode === 302, `signup unexpected: ${signup.statusCode} ${signup.text}`)

  const login = await postForm('/auth/password/login', { email, password }, jar)
  assertOk(login.statusCode === 302, `login unexpected: ${login.statusCode} ${login.text}`)

  const statsPath = `/api/works/${encodeURIComponent(workAuthorId)}/${encodeURIComponent(workSlug)}/stats`
  const mePath = `/api/works/${encodeURIComponent(workAuthorId)}/${encodeURIComponent(workSlug)}/me`
  const likePath = `/api/works/${encodeURIComponent(workAuthorId)}/${encodeURIComponent(workSlug)}/like`
  const bookmarkPath = `/api/works/${encodeURIComponent(workAuthorId)}/${encodeURIComponent(workSlug)}/bookmark`
  const commentsPath = `/api/works/${encodeURIComponent(workAuthorId)}/${encodeURIComponent(workSlug)}/comments`

  const stats0 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(stats0.ok, `stats ok=false: ${JSON.stringify(stats0)}`)

  const me0 = await getJson(mePath, jar)
  assertOk(me0.ok, `me ok=false: ${JSON.stringify(me0)}`)

  await postJson(likePath, null, jar)
  const statsLike1 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(
    statsLike1.data.likeCount === stats0.data.likeCount + 1,
    `likeCount should +1: ${JSON.stringify({ before: stats0.data, after: statsLike1.data })}`,
  )
  const me1 = await getJson(mePath, jar)
  assertOk(me1.data.liked === true, `liked should be true: ${JSON.stringify(me1)}`)

  await delJson(likePath, jar)
  const statsLike2 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(
    statsLike2.data.likeCount === stats0.data.likeCount,
    `likeCount should rollback: ${JSON.stringify({ before: stats0.data, after: statsLike2.data })}`,
  )
  const me2 = await getJson(mePath, jar)
  assertOk(me2.data.liked === false, `liked should be false: ${JSON.stringify(me2)}`)

  await postJson(bookmarkPath, null, jar)
  const statsBm1 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(
    statsBm1.data.bookmarkCount === stats0.data.bookmarkCount + 1,
    `bookmarkCount should +1: ${JSON.stringify({ before: stats0.data, after: statsBm1.data })}`,
  )
  const me3 = await getJson(mePath, jar)
  assertOk(me3.data.bookmarked === true, `bookmarked should be true: ${JSON.stringify(me3)}`)

  await delJson(bookmarkPath, jar)
  const statsBm2 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(
    statsBm2.data.bookmarkCount === stats0.data.bookmarkCount,
    `bookmarkCount should rollback: ${JSON.stringify({ before: stats0.data, after: statsBm2.data })}`,
  )
  const me4 = await getJson(mePath, jar)
  assertOk(me4.data.bookmarked === false, `bookmarked should be false: ${JSON.stringify(me4)}`)

  const commentBody = `e2e smoke ${new Date().toISOString()}`
  await postJson(commentsPath, { body: commentBody }, jar)
  const statsC1 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)
  assertOk(
    statsC1.data.commentCount === stats0.data.commentCount + 1,
    `commentCount should +1: ${JSON.stringify({ before: stats0.data, after: statsC1.data })}`,
  )
  const comments = await getJson(commentsPath, jar)
  assertOk(comments.ok, `comments ok=false: ${JSON.stringify(comments)}`)
  assertOk(
    Array.isArray(comments.data.items) &&
      comments.data.items.some((c) => String(c.body || '').includes('e2e smoke')),
    `comment not found: ${JSON.stringify(comments)}`,
  )

  const stats1 = await getJson(`${statsPath}?_ts=${Date.now()}`, jar)

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        email,
        work: `${workAuthorId}/${workSlug}`,
        stats: stats1.data,
      },
      null,
      2,
    ) + '\n',
  )
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n')
  process.exit(1)
})
