import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const outDir = path.join(repoRoot, 'out')
const distDir = path.join(repoRoot, 'dist')
const demosRoot = path.join(repoRoot, 'demos')

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function rmDirIfExists(p) {
  if (!(await pathExists(p))) return
  await fs.rm(p, { recursive: true, force: true })
}

async function copyDir(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true })
  await fs.cp(from, to, { recursive: true })
}

async function listDirs(p) {
  if (!(await pathExists(p))) return []
  const entries = await fs.readdir(p, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function assemble() {
  if (!(await pathExists(outDir))) {
    throw new Error(`Missing out/ directory. Run Next.js export first.`)
  }

  await rmDirIfExists(distDir)
  await copyDir(outDir, distDir)

  const authors = await listDirs(demosRoot)
  for (const authorId of authors) {
    const slugs = await listDirs(path.join(demosRoot, authorId))
    for (const slug of slugs) {
      const demoDist = path.join(demosRoot, authorId, slug, 'dist')
      if (!(await pathExists(demoDist))) continue
      const target = path.join(distDir, 'demos', authorId, slug)
      await rmDirIfExists(target)
      await copyDir(demoDist, target)
    }
  }
}

assemble().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
