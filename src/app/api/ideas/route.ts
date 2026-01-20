export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { checkRateLimit } from '@/server/api/ratelimit'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { getSupabaseEnv } from '@/server/supabase/env'
import { publishIdea } from '@/use-cases/ideas/publishIdea'

type Payload = {
  authorId: string
  title: string
  summary: string
  details?: string
  tags?: string[]
}

async function readPayloadAndImages(req: Request): Promise<{ payload: Payload; images: File[] }> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData()
    const raw = String(fd.get('payload') || '')
    const payload = JSON.parse(raw || '{}') as Payload
    const images: File[] = []
    const files = fd.getAll('images')
    for (const f of files) {
      if (f instanceof File) images.push(f)
    }
    return { payload, images }
  }
  const payload = (await req.json().catch(() => null)) as Payload | null
  if (!payload) throw new Error('缺少有效 payload')
  return { payload, images: [] }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey) {
      return jsonError(ApiErrorCode.SupabaseNotConfigured, 'Supabase 未配置', 500, {
        headers: { 'x-request-id': requestId },
      })
    }

    const supabase = await getSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr)
      return jsonError(ApiErrorCode.Unauthorized, '登录态无效', 401, {
        headers: { 'x-request-id': requestId },
      })
    const user = userData.user
    if (!user)
      return jsonError(ApiErrorCode.Unauthorized, '请先登录', 401, {
        headers: { 'x-request-id': requestId },
      })

    const { payload, images } = await readPayloadAndImages(req)
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
    const result = await publishIdea(
      { payload, images, userId: user.id, ip },
      { supabase, checkRateLimit, now: () => new Date() },
    )
    if (!result.ok)
      return jsonError(result.error.code, result.error.message, result.error.status, {
        headers: { 'x-request-id': requestId },
      })

    const { authorId, slug } = result.data
    console.info(JSON.stringify({ requestId, event: 'ideas.publish', authorId, slug }))
    return jsonOk(result.data, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
