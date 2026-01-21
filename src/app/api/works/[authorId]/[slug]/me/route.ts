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
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user)
    return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
      headers: { 'x-request-id': requestId },
    })

  const userId = userData.user.id

  const [{ data: likeRow, error: likeErr }, { data: bookmarkRow, error: bookmarkErr }] =
    await Promise.all([
      supabase
        .from('work_likes')
        .select('work_id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('work_bookmarks')
        .select('work_id')
        .eq('work_id', workId)
        .eq('user_id', userId)
        .maybeSingle(),
    ])

  if (likeErr)
    return jsonError(ApiErrorCode.SupabaseError, likeErr.message, 500, {
      headers: { 'x-request-id': requestId },
    })
  if (bookmarkErr)
    return jsonError(ApiErrorCode.SupabaseError, bookmarkErr.message, 500, {
      headers: { 'x-request-id': requestId },
    })

  return jsonOk(
    {
      liked: Boolean(likeRow),
      bookmarked: Boolean(bookmarkRow),
    },
    { headers: { 'x-request-id': requestId, 'cache-control': 'private, no-store' } },
  )
}
