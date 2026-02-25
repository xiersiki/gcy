import { promises as fs } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const manifestPath = path.join(repoRoot, '.next', 'app-build-manifest.json')

const strict = process.env.BUNDLE_BUDGET_STRICT === '1'
const budgets = {
  '/(main)/works/page': { routeOnly: 40 * 1024, total: 420 * 1024 },
  '/works/[authorId]/[slug]/page': { routeOnly: 50 * 1024, total: 420 * 1024 },
}

async function fileSize(filePath) {
  const stat = await fs.stat(filePath)
  return stat.size
}

async function main() {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(raw)
    const pages = manifest.pages ?? {}
    const chunkUsage = new Map()

    for (const files of Object.values(pages)) {
      for (const file of files ?? []) {
        if (!file.endsWith('.js')) continue
        chunkUsage.set(file, (chunkUsage.get(file) ?? 0) + 1)
      }
    }

    const isSharedRuntimeChunk = (file) => (chunkUsage.get(file) ?? 0) >= 5
    const warnings = []

    for (const [route, budget] of Object.entries(budgets)) {
      const files = pages[route] ?? []
      if (!files.length) continue

      const jsFiles = files.filter((item) => item.endsWith('.js'))
      let total = 0
      let routeOnly = 0
      for (const rel of jsFiles) {
        const abs = path.join(repoRoot, '.next', rel.replace(/^\//, ''))
        const size = await fileSize(abs)
        total += size
        if (!isSharedRuntimeChunk(rel)) {
          routeOnly += size
        }
      }

      if (routeOnly > budget.routeOnly || total > budget.total) {
        warnings.push(
          `${route}: routeOnly ${(routeOnly / 1024).toFixed(1)}kB > ${(budget.routeOnly / 1024).toFixed(1)}kB, total ${(total / 1024).toFixed(1)}kB > ${(budget.total / 1024).toFixed(1)}kB`,
        )
      }
    }

    if (!warnings.length) {
      console.log('[bundle-check] all monitored routes are within budget')
      return
    }

    console.warn('[bundle-check] budget warnings:')
    for (const line of warnings) {
      console.warn(`  - ${line}`)
    }

    if (strict) {
      process.exitCode = 1
    }
  } catch (error) {
    console.warn('[bundle-check] skipped:', error instanceof Error ? error.message : String(error))
  }
}

void main()
