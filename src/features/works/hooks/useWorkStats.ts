'use client'

import { useEffect, useMemo, useState } from 'react'

export type WorkStats = {
  likeCount: number
  bookmarkCount: number
  commentCount: number
}

const statsCache = new Map<string, { data: WorkStats; updatedAt: number }>()
const subscribersByKey = new Map<string, Set<() => void>>()

function notifyKey(key: string) {
  const subs = subscribersByKey.get(key)
  if (!subs) return
  for (const fn of subs) fn()
}

export function mutateWorkStats(
  authorId: string,
  slug: string,
  updater: Partial<WorkStats> | ((prev: WorkStats) => WorkStats),
) {
  const key = `${authorId}/${slug}`
  const prev = statsCache.get(key)?.data ?? { likeCount: 0, bookmarkCount: 0, commentCount: 0 }
  const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
  statsCache.set(key, { data: next, updatedAt: Date.now() })
  notifyKey(key)
}

export async function revalidateWorkStats(authorId: string, slug: string) {
  const key = `${authorId}/${slug}`
  const url = `/api/works/${encodeURIComponent(authorId)}/${encodeURIComponent(slug)}/stats?_ts=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(String(res.status))
  const json = (await res.json()) as { ok: true; data: WorkStats }
  const next = json.data
  statsCache.set(key, { data: next, updatedAt: Date.now() })
  notifyKey(key)
}

export function useWorkStats(authorId: string, slug: string) {
  const cacheKey = useMemo(() => `${authorId}/${slug}`, [authorId, slug])
  const [, bump] = useState(0)

  useEffect(() => {
    const onChange = () => bump((x) => x + 1)
    const set = subscribersByKey.get(cacheKey) ?? new Set<() => void>()
    set.add(onChange)
    subscribersByKey.set(cacheKey, set)
    return () => {
      const current = subscribersByKey.get(cacheKey)
      if (!current) return
      current.delete(onChange)
      if (current.size === 0) subscribersByKey.delete(cacheKey)
    }
  }, [cacheKey])

  const cached = statsCache.get(cacheKey)
  const [fetched, setFetched] = useState<WorkStats | null>(null)

  const data = cached?.data ?? fetched

  useEffect(() => {
    let cancelled = false
    const now = Date.now()
    const cachedNow = statsCache.get(cacheKey)
    if (cachedNow && now - cachedNow.updatedAt < 60_000) return

    fetch(`/api/works/${encodeURIComponent(authorId)}/${encodeURIComponent(slug)}/stats`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { ok: true; data: WorkStats }
        return json.data
      })
      .then((next) => {
        if (cancelled) return
        statsCache.set(cacheKey, { data: next, updatedAt: Date.now() })
        setFetched(next)
      })
      .catch(() => {
        if (cancelled) return
      })

    return () => {
      cancelled = true
    }
  }, [authorId, cacheKey, slug])

  return { data, loading: data == null }
}
