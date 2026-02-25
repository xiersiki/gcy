export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { z } from 'zod'

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

const CommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export async function GET(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const requestUrl = new URL(req.url)
  const limit = Math.min(50, Math.max(1, Number(requestUrl.searchParams.get('limit') || 20)))
  const before = requestUrl.searchParams.get('before')

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work) return workNotFoundError(requestId)

  const supabase = await getSupabaseServerClient()

  let q = supabase
    .from('work_comments')
    .select('id,work_id,user_id,body,created_at,updated_at')
    .eq('work_id', workId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) q = q.lt('created_at', before)
  const { data, error } = await q

  if (error)
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: withRequestIdHeaders(requestId),
    })

  const items = (data ?? []).map((row) => ({
    id: row.id as string,
    workId: row.work_id as string,
    userId: row.user_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }))

  const userIds = Array.from(new Set(items.map((c) => c.userId))).slice(0, 50)
  const profilesById: Record<
    string,
    { displayName?: string; avatarUrl?: string; githubUsername?: string }
  > = {}

  if (userIds.length) {
    const { data: profilesRaw, error: profileErr } = await supabase
      .from('profiles')
      .select('id,display_name,avatar_url,github_username')
      .in('id', userIds)

    if (!profileErr) {
      type ProfileRow = {
        id: string
        display_name: string | null
        avatar_url: string | null
        github_username: string | null
      }

      const profiles = (profilesRaw ?? []) as unknown as ProfileRow[]
      for (const p of profiles) {
        profilesById[p.id] = {
          displayName: p.display_name ? String(p.display_name) : undefined,
          avatarUrl: p.avatar_url ? String(p.avatar_url) : undefined,
          githubUsername: p.github_username ? String(p.github_username) : undefined,
        }
      }
    }
  }

  const nextCursor = items.length ? items[items.length - 1].createdAt : null

  return jsonOk(
    {
      items: items.map((c) => ({ ...c, profile: profilesById[c.userId] ?? null })),
      nextCursor,
    },
    {
      headers: {
        ...withRequestIdHeaders(requestId),
      },
    },
  )
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ authorId: string; slug: string }> },
) {
  const requestId = getRequestId(req)

  const supabaseNotConfigured = ensureSupabaseConfigured(requestId)
  if (supabaseNotConfigured) return supabaseNotConfigured

  const { workId, work } = await getWorkContext(ctx.params)
  if (!work) return workNotFoundError(requestId)

  const limited = ensureRateLimit(req, requestId, `comment:${workId}`, 10, 30_000)
  if (limited) return limited

  const payload = (await req.json().catch(() => null)) as unknown
  const parsed = CommentCreateSchema.safeParse(payload)
  if (!parsed.success)
    return jsonError(ApiErrorCode.BadRequest, '评论内容不合法', 400, {
      headers: withRequestIdHeaders(requestId),
    })

  const supabase = await getSupabaseServerClient()
  const userResult = await requireUserId(supabase, requestId)
  if (!userResult.ok) return userResult.response

  const userId = userResult.userId
  const { data, error } = await supabase
    .from('work_comments')
    .insert({ work_id: workId, user_id: userId, body: parsed.data.body })
    .select('id,work_id,user_id,body,created_at,updated_at')
    .single()

  if (error)
    return jsonError(ApiErrorCode.SupabaseError, error.message, 500, {
      headers: withRequestIdHeaders(requestId),
    })

  return jsonOk(
    {
      id: data.id as string,
      workId: data.work_id as string,
      userId: data.user_id as string,
      body: data.body as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    },
    { headers: withRequestIdHeaders(requestId) },
  )
}
