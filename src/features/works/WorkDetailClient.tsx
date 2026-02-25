'use client'

import { useEffect, useMemo, useState, ReactNode } from 'react'
import { Bookmark, Calendar, FileText, Heart, Layout, MessageSquare, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DemoFrame } from '@/components/demo/DemoFrame'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { AuthorProfile, WorkMeta } from '@/models/content'
import { useWorkActions } from './hooks/useWorkActions'
import { useWorkStats } from './hooks/useWorkStats'
import { WorkComments } from './WorkComments'
import styles from './WorkDetailClient.module.scss'

export type WorkDetailClientProps = {
  work: {
    id: string
    authorId: string
    slug: string
    meta: WorkMeta
  }
  author: AuthorProfile | undefined
  mdxContent: ReactNode
  demoUrl?: string
}

export type WorkDetailTab = 'preview' | 'docs' | 'comments'

export function parseWorkDetailTab(value: string | null): WorkDetailTab {
  return value === 'docs' || value === 'comments' ? value : 'preview'
}

export function WorkDetailClient({ work, author, mdxContent, demoUrl }: WorkDetailClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = parseWorkDetailTab(searchParams?.get('tab') ?? null)
  const { data: stats } = useWorkStats(work.authorId, work.slug)
  const { me, toggleLike, toggleBookmark, liking, bookmarking } = useWorkActions(
    work.authorId,
    work.slug,
  )
  const dateLabel = work.meta.date ? new Date(work.meta.date).toLocaleDateString() : ''
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const demoHeight = useMemo(() => {
    const base = work.meta.demo?.height && work.meta.demo.height > 0 ? work.meta.demo.height : 720
    if (!viewportHeight) return base
    const chrome = 72 + 24 + 24 + 56
    const fill = Math.max(640, viewportHeight - chrome)
    return Math.max(base, Math.min(5000, fill))
  }, [viewportHeight, work.meta.demo?.height])

  const switchTab = (nextTab: WorkDetailTab) => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '')
    if (nextTab === 'preview') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', nextTab)
    }
    const query = nextParams.toString()
    router.replace(query ? `${pathname ?? ''}?${query}` : (pathname ?? ''), { scroll: false })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{work.meta.title}</h1>
            <div className={styles.subtitleRow}>
              <span className={styles.authorHandle}>@{author?.id || work.authorId}</span>
              {dateLabel ? (
                <span className={styles.metaInline}>
                  <Calendar size={14} />
                  {dateLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.headerActions}>
              <div className={styles.stats}>
                <span className={styles.stat}>
                  <Heart size={14} />
                  {stats?.likeCount ?? 0}
                </span>
                <span className={styles.stat}>
                  <MessageSquare size={14} />
                  {stats?.commentCount ?? 0}
                </span>
              </div>

              <button
                type="button"
                className={`${styles.actionBtn} ${me?.liked ? styles.likeActive : ''}`}
                onClick={toggleLike}
                aria-label="Like"
                aria-pressed={Boolean(me?.liked)}
                disabled={liking}
              >
                <Heart size={18} fill={me?.liked ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${me?.bookmarked ? styles.actionBtnActive : ''}`}
                onClick={toggleBookmark}
                aria-label="Bookmark"
                aria-pressed={Boolean(me?.bookmarked)}
                disabled={bookmarking}
              >
                <Bookmark size={18} />
              </button>

              <ThemeToggle />
              <button
                type="button"
                onClick={() => router.back()}
                className={styles.closeBtn}
                aria-label="Back"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          <section className={styles.primary}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.tabs} role="tablist" aria-label="作品详情标签页">
                  <button
                    id="work-tab-preview"
                    type="button"
                    className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                    onClick={() => switchTab('preview')}
                    role="tab"
                    aria-selected={activeTab === 'preview'}
                    aria-controls="work-tab-panel"
                  >
                    <Layout size={18} />
                    <span>作品预览</span>
                  </button>
                  <button
                    id="work-tab-docs"
                    type="button"
                    className={`${styles.tab} ${activeTab === 'docs' ? styles.active : ''}`}
                    onClick={() => switchTab('docs')}
                    role="tab"
                    aria-selected={activeTab === 'docs'}
                    aria-controls="work-tab-panel"
                  >
                    <FileText size={18} />
                    <span>技术文档</span>
                  </button>
                  <button
                    id="work-tab-comments"
                    type="button"
                    className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
                    onClick={() => switchTab('comments')}
                    role="tab"
                    aria-selected={activeTab === 'comments'}
                    aria-controls="work-tab-panel"
                  >
                    <MessageSquare size={18} />
                    <span>评论</span>
                    <span className={styles.tabCount}>{stats?.commentCount ?? 0}</span>
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                {activeTab === 'preview' ? (
                  <div
                    id="work-tab-panel"
                    role="tabpanel"
                    aria-labelledby={`work-tab-${activeTab}`}
                    className={styles.previewContainer}
                  >
                    {demoUrl ? (
                      <DemoFrame
                        src={demoUrl}
                        height={demoHeight}
                        title={`${work.meta.title} Demo`}
                      />
                    ) : (
                      <div className={styles.noPreview}>
                        <Layout size={40} />
                        <p>该作品暂无预览</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'docs' ? (
                  <div
                    id="work-tab-panel"
                    role="tabpanel"
                    aria-labelledby={`work-tab-${activeTab}`}
                    className={styles.docsWrapper}
                  >
                    <article className={styles.prose}>{mdxContent}</article>
                  </div>
                ) : (
                  <div
                    id="work-tab-panel"
                    role="tabpanel"
                    aria-labelledby={`work-tab-${activeTab}`}
                    className={styles.commentsPanel}
                  >
                    <WorkComments authorId={work.authorId} slug={work.slug} />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
