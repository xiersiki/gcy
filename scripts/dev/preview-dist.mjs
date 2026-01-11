import http from 'node:http'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const distDir = path.join(repoRoot, 'dist')

const port = Number(process.env.PORT ?? 4173)

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function safeJoin(base, urlPath) {
  const normalized = urlPath.split('?')[0]?.split('#')[0] ?? '/'
  const joined = path.join(base, normalized)
  if (!joined.startsWith(base)) return null
  return joined
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(400)
      res.end('Bad Request')
      return
    }

    const filePath = safeJoin(distDir, decodeURIComponent(req.url))
    if (!filePath) {
      res.writeHead(400)
      res.end('Bad Request')
      return
    }

    let resolved = filePath
    const stat = await fs.stat(resolved).catch(() => null)
    if (stat?.isDirectory()) resolved = path.join(resolved, 'index.html')

    if (!(await pathExists(resolved))) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Not Found')
      return
    }

    const ext = path.extname(resolved)
    res.writeHead(200, { 'content-type': contentTypes[ext] ?? 'application/octet-stream' })
    res.end(await fs.readFile(resolved))
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Internal Server Error')
  }
})

async function main() {
  if (!(await pathExists(distDir))) {
    console.error(`dist/ not found. Run "pnpm build" first.`)
    process.exitCode = 1
    return
  }

  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}`)
  })
}

main()
