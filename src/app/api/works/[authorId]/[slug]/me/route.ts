export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'

import {
  ensureSupabaseConfigured,
  getWorkContext,
  requireUserId,
  withRequestIdHeaders,
  workNotFoundError,
} from '../_shared'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work) return workNotFoundError(requestId)

  const supabase = await getSupabaseServerClient()
  const userResult = await requireUserId(supabase, requestId)
  if (!userResult.ok) return userResult.response
  const userId = userResult.userId

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
      headers: withRequestIdHeaders(requestId),
    })
  if (bookmarkErr)
    return jsonError(ApiErrorCode.SupabaseError, bookmarkErr.message, 500, {
      headers: withRequestIdHeaders(requestId),
    })

  return jsonOk(
    {
      liked: Boolean(likeRow),
      bookmarked: Boolean(bookmarkRow),
    },
    { headers: withRequestIdHeaders(requestId, { 'cache-control': 'private, no-store' }) },
  )
}
