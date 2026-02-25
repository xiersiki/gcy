'use client'

import { useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { isApiRequestError, requestApiData } from '@/shared/api'
import { useApiResource } from '@/shared/useApiResource'
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

  const {
    data: me,
    loading,
    setData: setMeData,
  } = useApiResource<WorkMe | null>(
    base,
    async ({ signal }) => {
      try {
        return await requestApiData<WorkMe>(`${base}/me`, { signal })
      } catch (error) {
        if (isApiRequestError(error) && error.status === 401) return null
        throw error
      }
    },
    { immediate: true },
  )
  const [liking, setLiking] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  const likingRef = useRef(false)
  const bookmarkingRef = useRef(false)
  const likeTokenRef = useRef(0)
  const bookmarkTokenRef = useRef(0)

  const requireLogin = () => {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ''
    router.push(`/login${next}`)
  }

  const toggleLike = async () => {
    if (likingRef.current) return
    if (!me) return requireLogin()
    likingRef.current = true
    setLiking(true)
    likeTokenRef.current += 1
    const token = likeTokenRef.current
    const prev = me
    const nextLiked = !me.liked
    setMeData(() => ({ ...me, liked: nextLiked }))
    mutateWorkStats(authorId, slug, (s) => ({
      ...s,
      likeCount: Math.max(0, s.likeCount + (nextLiked ? 1 : -1)),
    }))
    try {
      await requestApiData<{ liked: boolean }>(`${base}/like`, {
        method: nextLiked ? 'POST' : 'DELETE',
      })
      void revalidateWorkStats(authorId, slug).catch(() => {})
    } catch (error) {
      if (isApiRequestError(error) && error.status === 401) {
        setMeData(() => null)
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          likeCount: Math.max(0, s.likeCount + (nextLiked ? -1 : 1)),
        }))
        return requireLogin()
      }
      if (likeTokenRef.current === token) {
        setMeData(() => prev)
      }
      mutateWorkStats(authorId, slug, (s) => ({
        ...s,
        likeCount: Math.max(0, s.likeCount + (nextLiked ? -1 : 1)),
      }))
    } finally {
      if (likeTokenRef.current === token) {
        likingRef.current = false
        setLiking(false)
      }
    }
  }

  const toggleBookmark = async () => {
    if (bookmarkingRef.current) return
    if (!me) return requireLogin()
    bookmarkingRef.current = true
    setBookmarking(true)
    bookmarkTokenRef.current += 1
    const token = bookmarkTokenRef.current
    const prev = me
    const nextBookmarked = !me.bookmarked
    setMeData(() => ({ ...me, bookmarked: nextBookmarked }))
    mutateWorkStats(authorId, slug, (s) => ({
      ...s,
      bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? 1 : -1)),
    }))
    try {
      await requestApiData<{ bookmarked: boolean }>(`${base}/bookmark`, {
        method: nextBookmarked ? 'POST' : 'DELETE',
      })
      void revalidateWorkStats(authorId, slug).catch(() => {})
    } catch (error) {
      if (isApiRequestError(error) && error.status === 401) {
        setMeData(() => null)
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? -1 : 1)),
        }))
        return requireLogin()
      }
      if (bookmarkTokenRef.current === token) {
        setMeData(() => prev)
      }
      mutateWorkStats(authorId, slug, (s) => ({
        ...s,
        bookmarkCount: Math.max(0, s.bookmarkCount + (nextBookmarked ? -1 : 1)),
      }))
    } finally {
      if (bookmarkTokenRef.current === token) {
        bookmarkingRef.current = false
        setBookmarking(false)
      }
    }
  }

  return {
    me,
    loading,
    liking,
    bookmarking,
    toggleLike,
    toggleBookmark,
  }
}
