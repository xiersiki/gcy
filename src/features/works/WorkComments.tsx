'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { isApiRequestError, requestApiData } from '@/shared/api'
import { useApiResource } from '@/shared/useApiResource'
import { mutateWorkStats, revalidateWorkStats } from './hooks/useWorkStats'
import styles from './WorkComments.module.scss'

type Profile = {
  displayName?: string
  avatarUrl?: string
  githubUsername?: string
}

type CommentItem = {
  id: string
  workId: string
  userId: string
  body: string
  createdAt: string
  updatedAt: string
  profile: Profile | null
}

type CommentsPage = {
  items: CommentItem[]
  nextCursor: string | null
}

export function WorkComments({ authorId, slug }: { authorId: string; slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const base = useMemo(
    () => `/api/works/${encodeURIComponent(authorId)}/${encodeURIComponent(slug)}/comments`,
    [authorId, slug],
  )

  const [items, setItems] = useState<CommentItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [posting, setPosting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [draft, setDraft] = useState('')
  const loadMoreControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      loadMoreControllerRef.current?.abort()
    }
  }, [])

  const buildCommentsUrl = (before: string | null) => {
    const url = new URL(base, window.location.origin)
    url.searchParams.set('limit', '20')
    if (before) url.searchParams.set('before', before)
    return url.toString()
  }

  const commentsResource = useApiResource<CommentsPage>(
    base,
    async ({ signal }) => {
      return requestApiData<CommentsPage>(buildCommentsUrl(null), { signal })
    },
    { immediate: true },
  )

  useEffect(() => {
    if (!commentsResource.data) return
    setItems(commentsResource.data.items)
    setNextCursor(commentsResource.data.nextCursor)
  }, [commentsResource.data])

  useEffect(() => {
    if (!commentsResource.error) return
    setError('评论加载失败，请稍后重试')
  }, [commentsResource.error])

  const requireLogin = () => {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ''
    router.push(`/login${next}`)
  }

  const submit = async () => {
    const body = draft.trim()
    if (!body) return
    const tempId = `temp-${Date.now()}`
    const temp: CommentItem = {
      id: tempId,
      workId: `${authorId}/${slug}`,
      userId: 'me',
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: { displayName: '我' },
    }
    setItems((prev) => [temp, ...prev])
    mutateWorkStats(authorId, slug, (s) => ({
      ...s,
      commentCount: Math.max(0, s.commentCount + 1),
    }))
    setPosting(true)
    try {
      await requestApiData<{ id: string }>(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      setDraft('')
      void revalidateWorkStats(authorId, slug).catch(() => {})
      const reloadResult = await commentsResource.reload()
      if (reloadResult.ok) {
        setItems(reloadResult.data.items)
        setNextCursor(reloadResult.data.nextCursor)
      }
      setError('')
    } catch (error) {
      if (isApiRequestError(error) && error.status === 401) {
        setItems((prev) => prev.filter((c) => c.id !== tempId))
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          commentCount: Math.max(0, s.commentCount - 1),
        }))
        return requireLogin()
      }
      setItems((prev) => prev.filter((c) => c.id !== tempId))
      mutateWorkStats(authorId, slug, (s) => ({
        ...s,
        commentCount: Math.max(0, s.commentCount - 1),
      }))
      setError('评论发送失败，请稍后再试')
    } finally {
      setPosting(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>评论</h3>
        <div className={styles.count}>{items.length ? `${items.length} 条` : ''}</div>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
          <button
            type="button"
            className={styles.retryBtn}
            onClick={async () => {
              setError('')
              const result = await commentsResource.reload()
              if (!result.ok) {
                setError('评论加载失败，请稍后重试')
              }
            }}
          >
            重试
          </button>
        </div>
      ) : null}
      {commentsResource.loading ? <div className={styles.hint}>加载中…</div> : null}

      <div className={styles.list}>
        {items.map((c) => (
          <div key={c.id} className={styles.item}>
            <div className={styles.meta}>
              <div className={styles.author}>
                {c.profile?.displayName ||
                  (c.profile?.githubUsername ? `@${c.profile.githubUsername}` : null) ||
                  c.userId.slice(0, 8)}
              </div>
              <div className={styles.date}>{new Date(c.createdAt).toLocaleString()}</div>
            </div>
            <div className={styles.body}>{c.body}</div>
          </div>
        ))}
      </div>

      {nextCursor ? (
        <button
          type="button"
          className={styles.loadMore}
          disabled={loadingMore}
          onClick={async () => {
            if (!nextCursor) return
            loadMoreControllerRef.current?.abort()
            const controller = new AbortController()
            loadMoreControllerRef.current = controller
            setLoadingMore(true)
            try {
              const data = await requestApiData<CommentsPage>(buildCommentsUrl(nextCursor), {
                signal: controller.signal,
              })
              setItems((prev) => [...prev, ...data.items])
              setNextCursor(data.nextCursor)
              setError('')
            } catch {
              if (!controller.signal.aborted) {
                setError('加载更多失败，请稍后重试')
              }
            } finally {
              if (loadMoreControllerRef.current === controller) {
                loadMoreControllerRef.current = null
                setLoadingMore(false)
              }
            }
          }}
        >
          {loadingMore ? '加载中…' : '加载更多'}
        </button>
      ) : null}

      <div style={{ height: 16 }} />

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          value={draft}
          placeholder="写下你的评论…（需要登录）"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              if (!posting && draft.trim()) void submit()
            }
          }}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            disabled={posting || !draft.trim()}
            onClick={submit}
          >
            发送
          </button>
        </div>
      </div>
    </section>
  )
}
