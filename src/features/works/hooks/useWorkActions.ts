'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { mutateWorkStats, revalidateWorkStats } from './useWorkStats'

type WorkMe = {
  liked: boolean
  bookmarked: boolean
}

export function useWorkActions(authorId: string, slug: string) {
  const router = useRouter()
  const pathname = usePathname()
  const base = useMemo(
    () => `/api/works/${encodeURIComponent(authorId)}/${encodeURIComponent(slug)}`,
    [authorId, slug],
  )

  const [me, setMe] = useState<WorkMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${base}/me`)
      .then(async (res) => {
        if (res.status === 401) return null
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { ok: true; data: WorkMe }
        return json.data
      })
      .then((data) => {
        if (cancelled) return
        setMe(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [base])

  const requireLogin = () => {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ''
    router.push(`/login${next}`)
  }

  const toggleLike = async () => {
    if (!me) return requireLogin()
    const prev = me
    const nextLiked = !me.liked
    setMe({ ...me, liked: nextLiked })
    mutateWorkStats(authorId, slug, (s) => ({
      ...s,
      likeCount: Math.max(0, s.likeCount + (nextLiked ? 1 : -1)),
    }))
    try {
      const res = await fetch(`${base}/like`, { method: nextLiked ? 'POST' : 'DELETE' })
      if (res.status === 401) {
        setMe(null)
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          likeCount: Math.max(0, s.likeCount + (nextLiked ? -1 : 1)),
        }))
        return requireLogin()
      }
      if (!res.ok) throw new Error(String(res.status))
      void revalidateWorkStats(authorId, slug).catch(() => {})
    } catch {
      setMe(prev)
      mutateWorkStats(authorId, slug, (s) => ({
        ...s,
        likeCount: Math.max(0, s.likeCount + (nextLiked ? -1 : 1)),
      }))
    }
  }

  const toggleBookmark = async () => {
    if (!me) return requireLogin()
    const prev = me
    const nextBookmarked = !me.bookmarked
    setMe({ ...me, bookmarked: nextBookmarked })
    mutateWorkStats(authorId, slug, (s) => ({
      ...s,
      bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? 1 : -1)),
    }))
    try {
      const res = await fetch(`${base}/bookmark`, { method: nextBookmarked ? 'POST' : 'DELETE' })
      if (res.status === 401) {
        setMe(null)
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? -1 : 1)),
        }))
        return requireLogin()
      }
      if (!res.ok) throw new Error(String(res.status))
      void revalidateWorkStats(authorId, slug).catch(() => {})
    } catch {
      setMe(prev)
      mutateWorkStats(authorId, slug, (s) => ({
        ...s,
        bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? -1 : 1)),
      }))
    }
  }

  return {
    me,
    loading,
    toggleLike,
    toggleBookmark,
  }
}
