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
    locale: z.enum(['zh', 'en']).optional(),
    readingTime: z.number().int().positive().optional(),
    featured: z.boolean().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const KEBAB_TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CATEGORY_ALLOWLIST = ['Web App', 'Case Study', 'Snippet', 'Engineering']
const SUMMARY_MIN_HARD = 20
const SUMMARY_MIN_SOFT = 40
const MDX_TEXT_MIN_HARD = 180
const MDX_TEXT_MIN_SOFT = 320

function extractMdxPlainText(raw) {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#[\]*_>!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function validateWorkMetaRules(meta, relMetaPath) {
  if (!ISO_DATE_RE.test(meta.date)) {
    throw new Error(`Invalid date format (YYYY-MM-DD): ${relMetaPath}`)
  }
  if (meta.tags?.length) {
    const deduped = new Set(meta.tags)
    if (deduped.size !== meta.tags.length) {
      throw new Error(`Duplicate tags are not allowed: ${relMetaPath}`)
    }
    const invalidTag = meta.tags.find((tag) => !KEBAB_TAG_RE.test(tag))
    if (invalidTag) {
      throw new Error(`Invalid tag "${invalidTag}" (use kebab-case): ${relMetaPath}`)
    }
  }
  if (meta.category && !CATEGORY_ALLOWLIST.includes(meta.category)) {
    throw new Error(
      `Invalid category "${meta.category}" (allowed: ${CATEGORY_ALLOWLIST.join(', ')}): ${relMetaPath}`,
    )
  }
  const summaryLength = (meta.summary || '').trim().length
  if (summaryLength < SUMMARY_MIN_HARD) {
    throw new Error(`Summary is too short (<${SUMMARY_MIN_HARD} chars): ${relMetaPath}`)
  }
  if (summaryLength < SUMMARY_MIN_SOFT) {
    console.warn(
      `[content:validate] warning: summary is short (<${SUMMARY_MIN_SOFT} chars): ${relMetaPath}`,
    )
  }
}

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

function warnSkippedIncompleteWork(authorId, slug) {
  console.warn(
    `[content:validate] warning: skipped incomplete work directory (missing meta.yml and index.mdx): content/works/${authorId}/${slug}`,
  )
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
      const hasMeta = await pathExists(metaPath)
      const hasMdx = await pathExists(mdxPath)
      if (!hasMeta && !hasMdx) {
        warnSkippedIncompleteWork(authorId, slug)
        continue
      }
      if (!hasMeta) {
        throw new Error(`Missing work meta.yml: ${path.relative(repoRoot, metaPath)}`)
      }
      if (!hasMdx) {
        throw new Error(`Missing work index.mdx: ${path.relative(repoRoot, mdxPath)}`)
      }
      const meta = WorkMetaSchema.parse(await readYamlFile(metaPath))
      validateWorkMetaRules(meta, path.relative(repoRoot, metaPath))
      const mdxRaw = await fs.readFile(mdxPath, 'utf8')
      const mdxTextLength = extractMdxPlainText(mdxRaw).length
      if (mdxTextLength < MDX_TEXT_MIN_HARD) {
        throw new Error(
          `MDX content is too short (<${MDX_TEXT_MIN_HARD} chars): ${path.relative(repoRoot, mdxPath)}`,
        )
      }
      if (mdxTextLength < MDX_TEXT_MIN_SOFT) {
        console.warn(
          `[content:validate] warning: MDX content is short (<${MDX_TEXT_MIN_SOFT} chars): ${path.relative(repoRoot, mdxPath)}`,
        )
      }
      workIds.push(`${authorId}/${slug}`)
    }
  }

  assertNoDuplicateIds(workIds, 'Work id')
}

validate().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
