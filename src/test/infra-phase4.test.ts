import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(process.cwd())

async function readUtf8(relPath: string) {
  return readFile(path.join(repoRoot, relPath), 'utf8')
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const absDir = path.join(repoRoot, dir)
  const entries = await readdir(absDir, { withFileTypes: true })
  for (const ent of entries) {
    const next = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(next)))
      continue
    }
    out.push(next)
  }
  return out
}

describe('Phase 4 infra guardrails', () => {
  it('auth routes use shared Supabase route client helper', async () => {
    const authRoutes = [
      'src/app/auth/github/route.ts',
      'src/app/auth/callback/route.ts',
      'src/app/auth/logout/route.ts',
      'src/app/auth/password/login/route.ts',
      'src/app/auth/password/signup/route.ts',
    ]

    for (const file of authRoutes) {
      const code = await readUtf8(file)
      expect(code).toContain("export const runtime = 'edge'")
      expect(code).toContain('createSupabaseRouteClient')
      expect(code).not.toContain("from '@supabase/ssr'")
    }
  })

  it('no raw GitHub API base URL usage outside github client', async () => {
    const files = (await walkFiles('src')).filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'))
    const offenders: string[] = []
    for (const file of files) {
      if (file.startsWith('src/test/')) continue
      if (file === 'src/server/github/client.ts') continue
      const code = await readUtf8(file)
      if (code.includes('https://api.github.com')) offenders.push(file)
    }
    expect(offenders).toEqual([])
  })
})
