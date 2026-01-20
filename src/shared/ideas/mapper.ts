import type { IdeaIndexItem, IdeaStatus } from '@/models/idea'

export function normalizeIdeaStatus(input: unknown): IdeaStatus {
  const raw = String(input ?? 'open')
  if (raw === 'open' || raw === 'in-progress' || raw === 'done') return raw
  return 'open'
}

export function mapIdeaRowToIndexItem(row: Record<string, unknown>): IdeaIndexItem {
  const authorId = String(row.author_id ?? '')
  const slug = String(row.slug ?? '')
  const createdAt = String(row.created_at ?? '')

  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[])
        .map(String)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
    : undefined

  const pendingRaw = row.pending
  const pending = typeof pendingRaw === 'boolean' ? pendingRaw : false

  return {
    id: `${authorId}/${slug}`,
    authorId,
    slug,
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    date: createdAt ? createdAt.slice(0, 10) : '',
    tags,
    idea: {
      status: normalizeIdeaStatus(row.status),
      claimedBy: row.claimed_by ? String(row.claimed_by) : undefined,
      claimedAt: row.claimed_at ? String(row.claimed_at) : undefined,
      claimPrUrl: row.claim_pr_url ? String(row.claim_pr_url) : undefined,
      implementedWorkId: row.implemented_work_id ? String(row.implemented_work_id) : undefined,
      implementedPrUrl: row.implemented_pr_url ? String(row.implemented_pr_url) : undefined,
      branch: row.branch ? String(row.branch) : undefined,
      compareUrl: row.compare_url ? String(row.compare_url) : undefined,
      pending,
    },
    source: 'supabase',
  }
}

export function mapIdeaPublishDtoToIndexItem(dto: {
  authorId: string
  slug: string
  title: string
  summary: string
  tags?: string[]
  status?: unknown
  createdAt?: string
  claimedBy?: string | null
  claimPrUrl?: string | null
}): IdeaIndexItem {
  const authorId = String(dto.authorId ?? '')
  const slug = String(dto.slug ?? '')
  const createdAt = String(dto.createdAt ?? '')

  const tags = Array.isArray(dto.tags)
    ? dto.tags
        .map(String)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12)
    : undefined

  return {
    id: `${authorId}/${slug}`,
    authorId,
    slug,
    title: String(dto.title ?? ''),
    summary: String(dto.summary ?? ''),
    date: createdAt ? createdAt.slice(0, 10) : '',
    tags,
    idea: {
      status: normalizeIdeaStatus(dto.status),
      claimedBy: dto.claimedBy ? String(dto.claimedBy) : undefined,
      claimPrUrl: dto.claimPrUrl ? String(dto.claimPrUrl) : undefined,
      pending: false,
    },
    source: 'supabase',
  }
}
