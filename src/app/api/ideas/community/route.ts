export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { jsonError, jsonOk } from '@/server/api/response'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { getSupabaseEnv } from '@/server/supabase/env'
import { mapIdeaRowToIndexItem } from '@/shared/ideas/mapper'

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
      (data ?? []).map((row) => mapIdeaRowToIndexItem(row as Record<string, unknown>)) ?? []

    return jsonOk(items, { headers: { 'x-request-id': requestId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : '加载失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
