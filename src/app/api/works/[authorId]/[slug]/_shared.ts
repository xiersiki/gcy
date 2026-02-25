import { ApiErrorCode } from '@/server/api/errors'
import { checkRateLimit } from '@/server/api/ratelimit'
import { getSupabaseEnv } from '@/server/supabase/env'
import { jsonError } from '@/server/api/response'
import { works } from '@/generated/content'

export async function getWorkContext(params: Promise<{ authorId: string; slug: string }>) {
  const { authorId, slug } = await params
  const workId = `${authorId}/${slug}`
  const work = works[workId]
  return { authorId, slug, workId, work }
}

export function ensureSupabaseConfigured(requestId: string) {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey)
    return jsonError(ApiErrorCode.SupabaseNotConfigured, 'Supabase 未配置', 500, {
      headers: { 'x-request-id': requestId },
    })
  return null
}

export function withRequestIdHeaders(requestId: string, headers?: HeadersInit): HeadersInit {
  return {
    'x-request-id': requestId,
    ...(headers || {}),
  }
}

export function workNotFoundError(requestId: string) {
  return jsonError(ApiErrorCode.NotFound, '作品不存在', 404, {
    headers: withRequestIdHeaders(requestId),
  })
}

export function getClientIp(req: Request) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
}

export function ensureRateLimit(
  req: Request,
  requestId: string,
  key: string,
  limit: number,
  windowMs: number,
) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(`${key}:${ip}`, limit, windowMs)
  if (limited.ok) return null
  return jsonError(ApiErrorCode.RateLimited, '请求过于频繁', 429, {
    headers: withRequestIdHeaders(requestId),
  })
}

export async function requireUserId(
  supabase: Awaited<ReturnType<typeof import('@/server/supabase/server').getSupabaseServerClient>>,
  requestId: string,
) {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    return {
      ok: false as const,
      response: jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
        headers: withRequestIdHeaders(requestId),
      }),
    }
  }
  return { ok: true as const, userId: userData.user.id }
}
