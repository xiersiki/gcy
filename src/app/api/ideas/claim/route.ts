export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { checkRateLimit } from '@/server/api/ratelimit'
import { jsonError, jsonOk } from '@/server/api/response'
import { createGitHubClient, githubRequest } from '@/server/github/client'
import { getSupabaseEnv } from '@/server/supabase/env'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { claimIdea } from '@/use-cases/ideas/claimIdea'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const body = (await req.json().catch(() => null)) as {
      authorId?: unknown
      slug?: unknown
      implementAuthorId?: unknown
    } | null
    if (!body)
      return jsonError(ApiErrorCode.BadRequest, '缺少有效 payload', 400, {
        headers: { 'x-request-id': requestId },
      })

    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey)
      return jsonError(ApiErrorCode.SupabaseNotConfigured, 'Supabase 未配置', 500, {
        headers: { 'x-request-id': requestId },
      })

    const supabase = await getSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user)
      return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
        headers: { 'x-request-id': requestId },
      })
    const user = userData.user

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
    let ghClient
    try {
      ghClient = createGitHubClient()
    } catch {
      return jsonError(ApiErrorCode.GitHubError, '缺少 GitHub 配置', 500, {
        headers: { 'x-request-id': requestId },
      })
    }

    const result = await claimIdea(
      {
        authorId: String(body.authorId ?? ''),
        slug: String(body.slug ?? ''),
        implementAuthorId: String(body.implementAuthorId ?? ''),
        userId: user.id,
        userEmail: user.email ?? undefined,
        ip,
      },
      { supabase, ghClient, githubRequest, checkRateLimit, now: () => new Date() },
    )

    if (!result.ok)
      return jsonError(result.error.code, result.error.message, result.error.status, {
        headers: { 'x-request-id': requestId },
      })
    return jsonOk(result.data, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '认领失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
