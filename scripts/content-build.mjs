import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from 'prettier'
import YAML from 'yaml'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const contentRoot = path.join(repoRoot, 'content')
const authorsRoot = path.join(contentRoot, 'authors')
const worksRoot = path.join(contentRoot, 'works')
const generatedRoot = path.join(repoRoot, 'src', 'generated')
const generatedContentFile = path.join(generatedRoot, 'content.ts')

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

function stableJson(value) {
  return JSON.stringify(value, null, 2)
}

async function writeFileIfChanged(filePath, content) {
  const current = (await pathExists(filePath)) ? await fs.readFile(filePath, 'utf8') : null
  if (current === content) return false
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
  return true
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

async function build() {
  const authorIds = (await listChildDirectories(authorsRoot)).sort()
  const authors = {}

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
    authors[authorId] = profile
  }

  const works = {}
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
      const meta = WorkMetaSchema.parse(await readYamlFile(metaPath))
      const id = `${authorId}/${slug}`
      works[id] = {
        id,
        authorId,
        slug,
        meta,
        mdxImportPath: path
          .relative(path.join(repoRoot, 'src', 'generated'), mdxPath)
          .split(path.sep)
          .join('/'),
      }
    }
  }

  assertNoDuplicateIds(Object.keys(works), 'Work id')

  const workEntriesSorted = Object.values(works).sort((a, b) => {
    const da = a.meta.date ?? ''
    const db = b.meta.date ?? ''
    return da < db ? 1 : da > db ? -1 : a.id.localeCompare(b.id)
  })

  const fileLines = []
  fileLines.push(
    `import type { AuthorProfile, WorkEntry, WorkIndexItem, WorkMeta } from '../content/types'`,
  )
  fileLines.push(``)
  fileLines.push(`export const authors: Record<string, AuthorProfile> = ${stableJson(authors)}`)
  fileLines.push(``)

  const worksForTs = {}
  for (const work of workEntriesSorted) {
    worksForTs[work.id] = {
      id: work.id,
      authorId: work.authorId,
      slug: work.slug,
      meta: work.meta,
    }
  }

  fileLines.push(
    `export const works: Record<string, { id: string; authorId: string; slug: string; meta: WorkMeta }> = ${stableJson(worksForTs)}`,
  )
  fileLines.push(``)
  fileLines.push(`export const workLoaders: Record<string, WorkEntry['load']> = {`)
  for (const work of workEntriesSorted) {
    fileLines.push(
      `  ${JSON.stringify(work.id)}: () => import(${JSON.stringify(`./${work.mdxImportPath}`)}),`,
    )
  }
  fileLines.push(`}`)
  fileLines.push(``)
  fileLines.push(
    `export const worksList = Object.values(works).map((w) => ({ id: w.id, authorId: w.authorId, slug: w.slug, ...w.meta })) as WorkIndexItem[]`,
  )
  fileLines.push(``)
  fileLines.push(`export const tagsIndex = worksList.reduce((acc, w) => {`)
  fileLines.push(`  for (const tag of w.tags ?? []) {`)
  fileLines.push(`    acc[tag] ||= []`)
  fileLines.push(`    acc[tag].push(w.id)`)
  fileLines.push(`  }`)
  fileLines.push(`  return acc`)
  fileLines.push(`}, {} as Record<string, string[]>)`)
  fileLines.push(``)
  fileLines.push(
    `export const categories = Array.from(new Set(worksList.map((w) => w.category).filter((c): c is string => Boolean(c)))).sort()`,
  )
  fileLines.push(``)

  const content = `${fileLines.join('\n')}\n`
  const resolvedConfig = await prettier.resolveConfig(generatedContentFile)
  const formatted = await prettier.format(content, {
    ...resolvedConfig,
    filepath: generatedContentFile,
  })
  await writeFileIfChanged(generatedContentFile, formatted)
}

build().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
