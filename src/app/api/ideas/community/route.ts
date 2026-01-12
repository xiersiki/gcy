export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { getSupabaseEnv } from '@/server/supabase/env'
import type { IdeaIndexItem } from '@/models/idea'

function toWorkId(authorId: string, slug: string) {
  return `${authorId}/${slug}`
}

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey) return jsonOk([], { headers: { 'x-request-id': requestId } })

    const requestUrl = new URL(req.url)
    const status = requestUrl.searchParams.get('status')
    const limit = Math.min(50, Math.max(1, Number(requestUrl.searchParams.get('limit') || 30)))

    const supabase = await getSupabaseServerClient()
    let q = supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (status && ['open', 'in-progress', 'done'].includes(status)) q = q.eq('status', status)
    const { data, error } = await q
    if (error)
      return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
        headers: { 'x-request-id': requestId },
      })

    const items =
      (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const authorId = String(r.author_id ?? '')
        const slug = String(r.slug ?? '')
        const createdAt = String(r.created_at ?? '')
        const statusRaw = String(r.status ?? 'open')
        const statusNormalized =
          statusRaw === 'in-progress' || statusRaw === 'done' || statusRaw === 'open'
            ? statusRaw
            : 'open'
        return {
          id: toWorkId(authorId, slug),
          authorId,
          slug,
          title: String(r.title ?? ''),
          summary: String(r.summary ?? ''),
          date: createdAt ? createdAt.slice(0, 10) : '',
          tags: Array.isArray(r.tags) ? (r.tags as string[]) : undefined,
          idea: {
            status: statusNormalized,
            claimedBy: r.claimed_by ? String(r.claimed_by) : undefined,
            claimedAt: r.claimed_at ? String(r.claimed_at) : undefined,
            claimPrUrl: r.claim_pr_url ? String(r.claim_pr_url) : undefined,
            implementedWorkId: r.implemented_work_id ? String(r.implemented_work_id) : undefined,
            pending: false,
          },
          source: 'supabase' as const,
        } satisfies IdeaIndexItem
      }) ?? []

    return jsonOk(items, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '加载失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
