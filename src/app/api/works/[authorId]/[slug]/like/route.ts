export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { checkRateLimit } from '@/server/api/ratelimit'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'

import { ensureSupabaseConfigured, getWorkContext } from '../_shared'

export async function POST(
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

  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
  const limited = checkRateLimit(`like:${ip}:${workId}`, 10, 10_000)
  if (!limited.ok)
    return jsonError(ApiErrorCode.RateLimited, '请求过于频繁', 429, {
      headers: { 'x-request-id': requestId },
    })

  const supabase = await getSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user)
    return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
      headers: { 'x-request-id': requestId },
    })

  const userId = userData.user.id
  const { error } = await supabase.from('work_likes').insert({ work_id: workId, user_id: userId })
  if (error && error.code !== '23505')
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: { 'x-request-id': requestId },
    })

  return jsonOk({ liked: true }, { headers: { 'x-request-id': requestId } })
}

export async function DELETE(
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

  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
  const limited = checkRateLimit(`unlike:${ip}:${workId}`, 10, 10_000)
  if (!limited.ok)
    return jsonError(ApiErrorCode.RateLimited, '请求过于频繁', 429, {
      headers: { 'x-request-id': requestId },
    })

  const supabase = await getSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user)
    return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
      headers: { 'x-request-id': requestId },
    })

  const userId = userData.user.id
  const { error } = await supabase
    .from('work_likes')
    .delete()
    .eq('work_id', workId)
    .eq('user_id', userId)

  if (error)
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: { 'x-request-id': requestId },
    })

  return jsonOk({ liked: false }, { headers: { 'x-request-id': requestId } })
}
