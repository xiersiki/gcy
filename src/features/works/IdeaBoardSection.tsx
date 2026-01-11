'use client'

import { Button } from '@arco-design/web-react'
import { useMemo, useState } from 'react'

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
  const [activeStatus, setActiveStatus] = useState<'All' | 'open' | 'in-progress' | 'done'>('All')

  const filteredIdeas = useMemo(() => {
    if (activeStatus === 'All') return ideas
    return ideas.filter((w) => (w.idea?.status ?? 'open') === activeStatus)
  }, [activeStatus, ideas])

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
        <div className={styles.boardFilters}>
          {(['All', 'open', 'in-progress', 'done'] as const).map((key) => (
            <button
              key={`idea-filter:${key}`}
              type="button"
              onClick={() => setActiveStatus(key)}
              className={`${styles.chip} ${activeStatus === key ? styles.chipActive : ''}`}
            >
              {key === 'All'
                ? '全部'
                : key === 'open'
                  ? '可认领'
                  : key === 'in-progress'
                    ? '进行中'
                    : '已实现'}
            </button>
          ))}
        </div>
      </header>

      {filteredIdeas.length ? (
        <div className={styles.boardList}>
          {filteredIdeas.map((w) => {
            const authorName = authors[w.authorId]?.name ?? w.authorId
            const initial = authorName.trim().slice(0, 1).toUpperCase() || 'A'
            const status = w.idea?.status ?? 'open'
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
                    <span className={styles.boardAuthor}>{authorName}</span>
                    <span className={styles.boardDot}>·</span>
                    <span className={styles.boardDate}>{w.date}</span>
                    <span className={styles.boardDot}>·</span>
                    <span className={styles.boardType}>idea</span>
                    <span className={styles.boardDot}>·</span>
                    <span
                      className={`${styles.boardStatus} ${
                        status === 'open'
                          ? styles.boardStatusOpen
                          : status === 'in-progress'
                            ? styles.boardStatusProgress
                            : styles.boardStatusDone
                      }`}
                    >
                      {status === 'open'
                        ? '可认领'
                        : status === 'in-progress'
                          ? '进行中'
                          : '已实现'}
                      {status === 'in-progress' && w.idea?.claimedBy
                        ? ` · ${w.idea.claimedBy}`
                        : ''}
                    </span>
                  </div>
                  <h3 className={styles.boardItemTitle}>{w.title}</h3>
                  <p className={styles.boardSummary}>{w.summary}</p>
                  {w.tags?.length ? (
                    <div className={styles.boardTags}>
                      {w.tags.map((tag) => (
                        <span key={`${w.id}:tag:${tag}`} className={styles.boardTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={styles.boardAction}>
                  <button
                    type="button"
                    className={styles.boardButton}
                    onClick={() => onSelectIdea(w.id)}
                  >
                    {status === 'open' ? '去认领' : status === 'in-progress' ? '看进度' : '看成果'}
                  </button>
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
