'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout, FileText, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DemoFrame } from '@/components/demo/DemoFrame'
import type { AuthorProfile, WorkMeta } from '@/models/content'
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
  const [activeTab, setActiveTab] = useState<'preview' | 'docs'>('preview')
  const router = useRouter()

  return (
    <div className={styles.container}>
      {/* New Minimal Header based on Reference */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{work.meta.title}</h1>
            <p className={styles.authorLine}>
              Viewing work by{' '}
              <span className={styles.authorHandle}>@{author?.id || work.authorId}</span>
            </p>
          </div>

          <div className={styles.headerCenter}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Layout size={18} />
                <span>作品预览</span>
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'docs' ? styles.active : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                <FileText size={18} />
                <span>技术文档</span>
              </button>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button onClick={() => router.back()} className={styles.closeBtn} aria-label="Close">
              <X size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className={styles.mainContent}>
        <AnimatePresence mode="wait">
          {activeTab === 'preview' ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className={styles.previewContainer}
            >
              <div className={styles.previewCard}>
                {demoUrl ? (
                  <DemoFrame
                    src={demoUrl}
                    height={work.meta.demo?.height || 720}
                    title={`${work.meta.title} Demo`}
                  />
                ) : (
                  <div className={styles.noPreview}>
                    <Layout size={48} />
                    <p>该作品暂无预览</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={styles.docsWrapper}
            >
              <article className={styles.prose}>{mdxContent}</article>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
