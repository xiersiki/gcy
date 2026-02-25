export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'

import {
  ensureRateLimit,
  ensureSupabaseConfigured,
  getWorkContext,
  requireUserId,
  withRequestIdHeaders,
  workNotFoundError,
} from '../_shared'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work) return workNotFoundError(requestId)

  const limited = ensureRateLimit(req, requestId, `bookmark:${workId}`, 10, 10_000)
  if (limited) return limited

  const supabase = await getSupabaseServerClient()
  const userResult = await requireUserId(supabase, requestId)
  if (!userResult.ok) return userResult.response

  const userId = userResult.userId
  const { error } = await supabase
    .from('work_bookmarks')
    .insert({ work_id: workId, user_id: userId })
  if (error && error.code !== '23505')
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: withRequestIdHeaders(requestId),
    })

  return jsonOk({ bookmarked: true }, { headers: withRequestIdHeaders(requestId) })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work) return workNotFoundError(requestId)

  const limited = ensureRateLimit(req, requestId, `unbookmark:${workId}`, 10, 10_000)
  if (limited) return limited

  const supabase = await getSupabaseServerClient()
  const userResult = await requireUserId(supabase, requestId)
  if (!userResult.ok) return userResult.response

  const userId = userResult.userId
  const { error } = await supabase
    .from('work_bookmarks')
    .delete()
    .eq('work_id', workId)
    .eq('user_id', userId)

  if (error)
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: withRequestIdHeaders(requestId),
    })

  return jsonOk({ bookmarked: false }, { headers: withRequestIdHeaders(requestId) })
}
