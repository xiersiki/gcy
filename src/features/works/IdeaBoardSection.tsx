'use client'

import { GitPullRequest, Layout } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { AuthorProfile } from '@/models/content'
import type { IdeaIndexItem } from '@/models/idea'

import styles from './IdeaBoardSection.module.scss'

export type IdeaBoardSectionProps = {
  authors: Record<string, AuthorProfile>
  ideas: IdeaIndexItem[]
  onSelectIdea: (id: string) => void
}

export function IdeaBoardSection({ authors, ideas, onSelectIdea }: IdeaBoardSectionProps) {
  const [activeStatus, setActiveStatus] = useState<'All' | 'open' | 'in-progress' | 'done'>('All')

  const filteredIdeas = useMemo(() => {
    if (activeStatus === 'All') return ideas
    return ideas.filter((w) => w.idea.status === activeStatus)
  }, [activeStatus, ideas])

  return (
    <div className={styles.boardSection}>
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

      {filteredIdeas.length ? (
        <div className={styles.boardList}>
          {filteredIdeas.map((w) => {
            const author = authors[w.authorId]
            const authorName = author?.name ?? w.authorId
            const status = w.idea.status

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
                <div className={styles.boardItemHeader}>
                  <div className={styles.boardAvatar}>
                    {author?.avatar ? (
                      <img src={author.avatar} alt={authorName} />
                    ) : (
                      <div className={styles.boardAvatarPlaceholder}>
                        {authorName.trim().slice(0, 1).toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>
                  <div className={styles.boardItemInfo}>
                    <span className={styles.boardAuthor}>{authorName}</span>
                    <span className={styles.boardDate}>{w.date}</span>
                  </div>
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
                      ? 'Open'
                      : status === 'in-progress'
                        ? 'In Progress'
                        : 'Claimed'}
                  </span>
                </div>

                <div className={styles.boardItemContent}>
                  <h3 className={styles.boardItemTitle}>{w.title}</h3>
                  <p className={styles.boardSummary}>{w.summary}</p>
                </div>

                {status === 'in-progress' && w.idea.claimedBy && (
                  <div className={styles.boardClaimedBy}>
                    <div className={styles.dot} />
                    <span>Claimed by</span>
                    <span className={styles.handle}>@{w.idea.claimedBy}</span>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.boardButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectIdea(w.id)
                  }}
                >
                  {status === 'open' ? (
                    <>
                      <GitPullRequest />
                      <span>Accept & Start Dev</span>
                    </>
                  ) : status === 'in-progress' ? (
                    <>
                      <Layout />
                      <span>Check Progress</span>
                    </>
                  ) : (
                    <>
                      <Layout />
                      <span>View Results</span>
                    </>
                  )}
                </button>
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
    </div>
  )
}
