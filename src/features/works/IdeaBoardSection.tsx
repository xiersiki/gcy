'use client'

import Link from 'next/link'
import { Button } from '@arco-design/web-react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

import styles from './WorksHome.module.css'

export type IdeaBoardSectionProps = {
  authors: Record<string, AuthorProfile>
  ideas: WorkIndexItem[]
  onSelectIdea: (id: string) => void
  onOpenPublish: () => void
}

export function IdeaBoardSection({
  authors,
  ideas,
  onSelectIdea,
  onOpenPublish,
}: IdeaBoardSectionProps) {
  return (
    <section className={styles.boardSection}>
      <header className={styles.boardHeader}>
        <div className={styles.boardHeaderRow}>
          <h2 className={styles.boardTitle}>灵感/招募面板</h2>
          <Button
            className={styles.boardPublishButton}
            onClick={() => {
              onOpenPublish()
            }}
          >
            发布点子
          </Button>
        </div>
        <p className={styles.boardSubtitle}>发布点子并附上参考图，方便后来者对齐目标效果。</p>
      </header>

      {ideas.length ? (
        <div className={styles.boardList}>
          {ideas.map((w) => {
            const authorName = authors[w.authorId]?.name ?? w.authorId
            const href = `/works/${w.authorId}/${w.slug}`
            const initial = authorName.trim().slice(0, 1).toUpperCase() || 'A'
            return (
              <div
                key={`board:${w.id}`}
                className={styles.boardItem}
                role="button"
                aria-label={`查看点子：${w.title}`}
                tabIndex={0}
                onClick={() => onSelectIdea(w.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectIdea(w.id)
                }}
              >
                <div className={styles.boardAvatar} aria-hidden="true">
                  {initial}
                </div>
                <div className={styles.boardBody}>
                  <div className={styles.boardMeta}>
                    <Link
                      href={`/authors/${w.authorId}`}
                      className={styles.boardAuthor}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {authorName}
                    </Link>
                    <span className={styles.boardDot}>·</span>
                    <span className={styles.boardDate}>{w.date}</span>
                    <span className={styles.boardDot}>·</span>
                    <span className={styles.boardType}>idea</span>
                  </div>
                  <h3 className={styles.boardItemTitle}>
                    <Link href={href} onClick={(e) => e.stopPropagation()}>
                      {w.title}
                    </Link>
                  </h3>
                  <p className={styles.boardSummary}>{w.summary}</p>
                  {w.tags?.length ? (
                    <div className={styles.boardTags}>
                      {w.tags.map((tag) => (
                        <Link
                          key={`${w.id}:tag:${tag}`}
                          href={`/tags/${tag}`}
                          className={styles.boardTag}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={styles.boardAction}>
                  <Link
                    href={href}
                    className={styles.boardButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    去认领
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={styles.boardEmpty}>
          <h3>还没有招募条目</h3>
          <p>先发布一个点子吧。</p>
        </div>
      )}
    </section>
  )
}
