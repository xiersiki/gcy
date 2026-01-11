import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const workId = process.argv[2]
if (!workId || !workId.includes('/')) {
  console.error('Usage: pnpm dev:work -- <authorId>/<slug>')
  process.exitCode = 1
  process.exit()
}

const [authorId, slug] = workId.split('/')
const demoDir = path.join(repoRoot, 'demos', authorId, slug)

function run(cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: 'inherit', ...opts })
  child.on('exit', (code, signal) => {
    if (signal) return
    if (code && code !== 0) process.exitCode = code
  })
  return child
}

const main = run('pnpm', ['dev'], { cwd: repoRoot, env: process.env })
const demo = run('pnpm', ['dev'], { cwd: demoDir, env: process.env })

function shutdown() {
  demo.kill('SIGINT')
  main.kill('SIGINT')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
