import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { slugifyTitle } from '@/shared/slug'
import { ensureSafeId } from '@/shared/id'
import { ApiErrorCode } from '@/server/api/errors'
import type { UseCaseResult } from '../types'

export const PublishIdeaPayloadSchema = z.object({
  authorId: z.string(),
  title: z.string(),
  summary: z.string(),
  details: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type PublishIdeaPayload = z.infer<typeof PublishIdeaPayloadSchema>

export type PublishIdeaInput = {
  payload: PublishIdeaPayload
  images: File[]
  userId: string
  ip: string
}

export type PublishIdeaOutput = {
  id: string
  authorId: string
  slug: string
  title: string
  summary: string
  details: string | null
  tags: string[]
  status: string
  createdAt: string
  claimedBy: string | null
  claimPrUrl: string | null
  imageUrls: string[]
}

export type PublishIdeaDeps = {
  supabase: SupabaseClient
  checkRateLimit: (key: string, limit: number, windowMs: number) => { ok: boolean }
  now: () => Date
}

export async function publishIdea(
  input: PublishIdeaInput,
  deps: PublishIdeaDeps,
): Promise<UseCaseResult<PublishIdeaOutput, ApiErrorCode>> {
  const parsed = PublishIdeaPayloadSchema.safeParse(input.payload)
  if (!parsed.success)
    return {
      ok: false,
      error: { code: ApiErrorCode.BadRequest, message: '缺少有效 payload', status: 400 },
    }

  const rateKey = `ideas:publish:${input.userId}:${input.ip}`
  if (!deps.checkRateLimit(rateKey, 6, 60_000).ok)
    return {
      ok: false,
      error: { code: ApiErrorCode.RateLimited, message: '操作过于频繁，请稍后再试', status: 429 },
    }

  const authorId = ensureSafeId(parsed.data.authorId, 'authorId')
  const title = String(parsed.data.title || '').trim()
  const summary = String(parsed.data.summary || '').trim()
  if (!title)
    return {
      ok: false,
      error: { code: ApiErrorCode.BadRequest, message: '请填写标题', status: 400 },
    }
  if (!summary)
    return {
      ok: false,
      error: { code: ApiErrorCode.BadRequest, message: '请填写一句话简介', status: 400 },
    }

  const tags = (parsed.data.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
  const slug = slugifyTitle(title)

  const { data: inserted, error: insertErr } = await deps.supabase
    .from('ideas')
    .insert({
      author_id: authorId,
      title,
      slug,
      summary,
      details: parsed.data.details?.trim() || null,
      tags,
      status: 'open',
      created_by: input.userId,
    })
    .select('*')
    .single()

  if (insertErr || !inserted)
    return {
      ok: false,
      error: {
        code: ApiErrorCode.SupabaseError,
        message: insertErr?.message || '写入失败',
        status: 500,
      },
    }

  const maxImageBytes = 5 * 1024 * 1024
  const files = input.images.filter((f) => f.size <= maxImageBytes).slice(0, 6)
  const imageUrls: string[] = []

  for (const f of files) {
    const safeName = f.name.replace(/[^a-z0-9_.-]/gi, '')
    const objectPath = `${String((inserted as Record<string, unknown>).id ?? '')}/${deps.now().getTime()}-${safeName}`
    const { error: upErr } = await deps.supabase.storage
      .from('idea-images')
      .upload(objectPath, f, { contentType: f.type || 'application/octet-stream', upsert: false })
    if (upErr) continue
    const { data: publicData } = deps.supabase.storage.from('idea-images').getPublicUrl(objectPath)
    if (publicData.publicUrl) imageUrls.push(publicData.publicUrl)
  }

  const insertedId = String((inserted as Record<string, unknown>).id ?? '')
  if (imageUrls.length && insertedId) {
    await deps.supabase.from('ideas').update({ image_urls: imageUrls }).eq('id', insertedId)
  }

  return {
    ok: true,
    data: {
      id: insertedId,
      authorId,
      slug,
      title,
      summary,
      details: (inserted as Record<string, unknown>).details
        ? String((inserted as Record<string, unknown>).details)
        : null,
      tags,
      status: String((inserted as Record<string, unknown>).status ?? ''),
      createdAt: String((inserted as Record<string, unknown>).created_at ?? ''),
      claimedBy: (inserted as Record<string, unknown>).claimed_by
        ? String((inserted as Record<string, unknown>).claimed_by)
        : null,
      claimPrUrl: (inserted as Record<string, unknown>).claim_pr_url
        ? String((inserted as Record<string, unknown>).claim_pr_url)
        : null,
      imageUrls,
    },
  }
}
