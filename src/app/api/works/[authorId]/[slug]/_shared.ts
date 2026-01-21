import { ApiErrorCode } from '@/server/api/errors'
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
