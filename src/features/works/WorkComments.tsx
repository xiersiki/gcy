'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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

export function WorkComments({ authorId, slug }: { authorId: string; slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const base = useMemo(
    () => `/api/works/${encodeURIComponent(authorId)}/${encodeURIComponent(slug)}/comments`,
    [authorId, slug],
  )

  const [items, setItems] = useState<CommentItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [posting, setPosting] = useState(false)
  const [draft, setDraft] = useState('')

  const load = useCallback(
    async (before: string | null, signal?: AbortSignal) => {
      const url = new URL(base, window.location.origin)
      url.searchParams.set('limit', '20')
      if (before) url.searchParams.set('before', before)

      const res = await fetch(url.toString(), { signal })
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as {
        ok: true
        data: { items: CommentItem[]; nextCursor: string | null }
      }
      return json.data
    },
    [base],
  )

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setLoading(true)
    setError('')
    load(null, controller.signal)
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setNextCursor(data.nextCursor)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        if (e instanceof Error && e.name === 'AbortError') return
        setError('评论加载失败，请稍后重试')
        setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [load])

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
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.status === 401) {
        setItems((prev) => prev.filter((c) => c.id !== tempId))
        mutateWorkStats(authorId, slug, (s) => ({
          ...s,
          commentCount: Math.max(0, s.commentCount - 1),
        }))
        return requireLogin()
      }
      if (!res.ok) throw new Error(String(res.status))
      setDraft('')
      void revalidateWorkStats(authorId, slug).catch(() => {})
      const data = await load(null)
      setItems(data.items)
      setNextCursor(data.nextCursor)
      setError('')
    } catch {
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

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.hint}>加载中…</div> : null}

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
          onClick={async () => {
            try {
              const data = await load(nextCursor)
              setItems((prev) => [...prev, ...data.items])
              setNextCursor(data.nextCursor)
              setError('')
            } catch {
              setError('加载更多失败，请稍后重试')
            }
          }}
        >
          加载更多
        </button>
      ) : null}

      <div style={{ height: 16 }} />

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          value={draft}
          placeholder="写下你的评论…（需要登录）"
          onChange={(e) => setDraft(e.target.value)}
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
