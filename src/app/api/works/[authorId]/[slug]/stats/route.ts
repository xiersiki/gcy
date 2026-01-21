export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'

import { ensureSupabaseConfigured, getWorkContext } from '../_shared'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work)
    return jsonError(ApiErrorCode.NotFound, '作品不存在', 404, {
      headers: { 'x-request-id': requestId },
    })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('work_stats')
    .select('like_count,bookmark_count,comment_count')
    .eq('work_id', workId)
    .maybeSingle()

  if (error)
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: { 'x-request-id': requestId },
    })

  const payload = {
    likeCount: data?.like_count ?? 0,
    bookmarkCount: data?.bookmark_count ?? 0,
    commentCount: data?.comment_count ?? 0,
  }

  return jsonOk(payload, {
    headers: {
      'x-request-id': requestId,
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
