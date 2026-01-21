'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Calendar, FileText, Heart, Layout, MessageSquare, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

export function WorkDetailClient({ work, author, mdxContent, demoUrl }: WorkDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'docs' | 'comments'>('preview')
  const router = useRouter()
  const { data: stats } = useWorkStats(work.authorId, work.slug)
  const { me, toggleLike, toggleBookmark } = useWorkActions(work.authorId, work.slug)
  const dateLabel = work.meta.date ? new Date(work.meta.date).toLocaleDateString() : ''

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
              >
                <Heart size={18} fill={me?.liked ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${me?.bookmarked ? styles.actionBtnActive : ''}`}
                onClick={toggleBookmark}
                aria-label="Bookmark"
                aria-pressed={Boolean(me?.bookmarked)}
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
                <div className={styles.tabs}>
                  <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    <Layout size={18} />
                    <span>作品预览</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'docs' ? styles.active : ''}`}
                    onClick={() => setActiveTab('docs')}
                  >
                    <FileText size={18} />
                    <span>技术文档</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
                    onClick={() => setActiveTab('comments')}
                  >
                    <MessageSquare size={18} />
                    <span>评论</span>
                    <span className={styles.tabCount}>{stats?.commentCount ?? 0}</span>
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <AnimatePresence mode="wait">
                  {activeTab === 'preview' ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.985 }}
                      transition={{ duration: 0.25 }}
                      className={styles.previewContainer}
                    >
                      {demoUrl ? (
                        <DemoFrame
                          src={demoUrl}
                          height={work.meta.demo?.height || 720}
                          title={`${work.meta.title} Demo`}
                        />
                      ) : (
                        <div className={styles.noPreview}>
                          <Layout size={40} />
                          <p>该作品暂无预览</p>
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'docs' ? (
                    <motion.div
                      key="docs"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className={styles.docsWrapper}
                    >
                      <article className={styles.prose}>{mdxContent}</article>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="comments"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className={styles.commentsPanel}
                    >
                      <WorkComments authorId={work.authorId} slug={work.slug} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
