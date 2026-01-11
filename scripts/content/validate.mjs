import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const contentRoot = path.join(repoRoot, 'content')
const authorsRoot = path.join(contentRoot, 'authors')
const worksRoot = path.join(contentRoot, 'works')

const AuthorProfileSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    links: z.record(z.string()).optional(),
  })
  .strict()

const WorkTypeSchema = z.enum(['case-study', 'idea', 'demo', 'snippet'])

const WorkDemoSchema = z
  .object({
    kind: z.literal('iframe'),
    src: z.string().min(1),
    devSrc: z.string().min(1).optional(),
    height: z.number().int().positive().optional(),
  })
  .strict()

const WorkMetaSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    type: WorkTypeSchema,
    date: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
    category: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().optional(),
    demo: WorkDemoSchema.optional(),
    external: z
      .object({
        demoUrl: z.string().optional(),
        repoUrl: z.string().optional(),
        figmaUrl: z.string().optional(),
      })
      .optional(),
  })
  .strict()

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return YAML.parse(raw)
}

async function listChildDirectories(dirPath) {
  if (!(await pathExists(dirPath))) return []
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

function assertNoDuplicateIds(ids, label) {
  const seen = new Set()
  const duplicates = []
  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id)
    seen.add(id)
  }
  if (duplicates.length) {
    throw new Error(`${label} duplicates: ${duplicates.join(', ')}`)
  }
}

async function validate() {
  const authorIds = (await listChildDirectories(authorsRoot)).sort()
  for (const authorId of authorIds) {
    const profilePath = path.join(authorsRoot, authorId, 'profile.yml')
    if (!(await pathExists(profilePath))) {
      throw new Error(`Missing author profile.yml: ${path.relative(repoRoot, profilePath)}`)
    }
    const profile = AuthorProfileSchema.parse(await readYamlFile(profilePath))
    if (profile.id !== authorId) {
      throw new Error(
        `Author id mismatch: dir=${authorId} meta.id=${profile.id} (${path.relative(
          repoRoot,
          profilePath,
        )})`,
      )
    }
  }

  const workIds = []
  const worksAuthorIds = (await listChildDirectories(worksRoot)).sort()
  for (const authorId of worksAuthorIds) {
    const slugs = (await listChildDirectories(path.join(worksRoot, authorId))).sort()
    for (const slug of slugs) {
      const baseDir = path.join(worksRoot, authorId, slug)
      const metaPath = path.join(baseDir, 'meta.yml')
      const mdxPath = path.join(baseDir, 'index.mdx')
      if (!(await pathExists(metaPath))) {
        throw new Error(`Missing work meta.yml: ${path.relative(repoRoot, metaPath)}`)
      }
      if (!(await pathExists(mdxPath))) {
        throw new Error(`Missing work index.mdx: ${path.relative(repoRoot, mdxPath)}`)
      }
      WorkMetaSchema.parse(await readYamlFile(metaPath))
      workIds.push(`${authorId}/${slug}`)
    }
  }

  assertNoDuplicateIds(workIds, 'Work id')
}

validate().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
