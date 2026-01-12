export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { ApiErrorCode } from '@/server/api/errors'
import { getRequestId } from '@/server/api/request'
import { checkRateLimit } from '@/server/api/ratelimit'
import { jsonError, jsonOk } from '@/server/api/response'
import { slugifyTitle } from '@/server/ideas/slug'
import { ensureSafeId } from '@/shared/id'
import { getSupabaseServerClient } from '@/server/supabase/server'
import { getSupabaseEnv } from '@/server/supabase/env'

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

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip'
    const rateKey = `ideas:publish:${user.id}:${ip}`
    if (!checkRateLimit(rateKey, 6, 60_000).ok) {
      return jsonError(ApiErrorCode.RateLimited, '操作过于频繁，请稍后再试', 429, {
        headers: { 'x-request-id': requestId },
      })
    }

    const { payload, images } = await readPayloadAndImages(req)
    const authorId = ensureSafeId(payload.authorId, 'authorId')
    const title = String(payload.title || '').trim()
    const summary = String(payload.summary || '').trim()
    if (!title)
      return jsonError(ApiErrorCode.BadRequest, '请填写标题', 400, {
        headers: { 'x-request-id': requestId },
      })
    if (!summary)
      return jsonError(ApiErrorCode.BadRequest, '请填写一句话简介', 400, {
        headers: { 'x-request-id': requestId },
      })

    const tags = (payload.tags ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12)
    const slug = slugifyTitle(title)

    const { data: inserted, error: insertErr } = await supabase
      .from('ideas')
      .insert({
        author_id: authorId,
        title,
        slug,
        summary,
        details: payload.details?.trim() || null,
        tags,
        status: 'open',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertErr || !inserted) {
      const msg = insertErr?.message || '写入失败'
      return jsonError(ApiErrorCode.SupabaseError, msg, 500, {
        headers: { 'x-request-id': requestId },
      })
    }

    const maxImageBytes = 5 * 1024 * 1024
    const files = images.filter((f) => f.size <= maxImageBytes).slice(0, 6)
    const imageUrls: string[] = []
    for (const f of files) {
      const safeName = f.name.replace(/[^a-z0-9_.-]/gi, '')
      const objectPath = `${inserted.id}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from('idea-images')
        .upload(objectPath, f, { contentType: f.type || 'application/octet-stream', upsert: false })
      if (upErr) continue
      const { data: publicData } = supabase.storage.from('idea-images').getPublicUrl(objectPath)
      if (publicData.publicUrl) imageUrls.push(publicData.publicUrl)
    }

    if (imageUrls.length) {
      await supabase.from('ideas').update({ image_urls: imageUrls }).eq('id', inserted.id)
    }

    console.info(JSON.stringify({ requestId, event: 'ideas.publish', authorId, slug }))
    return jsonOk(
      {
        id: inserted.id as string,
        authorId,
        slug,
        title,
        summary,
        details: inserted.details as string | null,
        tags,
        status: inserted.status as string,
        createdAt: inserted.created_at as string,
        claimedBy: inserted.claimed_by as string | null,
        claimPrUrl: inserted.claim_pr_url as string | null,
        imageUrls,
      },
      { headers: { 'x-request-id': requestId } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交失败'
    return jsonError(ApiErrorCode.BadRequest, message, 500, {
      headers: { 'x-request-id': requestId },
    })
  }
}
