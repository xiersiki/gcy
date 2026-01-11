'use client'

import { useRouter } from 'next/navigation'
import { Calendar, User } from 'lucide-react'
import type { AuthorProfile, WorkIndexItem } from '@/models/content'
import { Modal } from '@/components/Modal'
import modalStyles from '@/components/Modal.module.scss'
import styles from './IdeaDetailsModal.module.scss'

export type IdeaDetailsModalProps = {
  authors: Record<string, AuthorProfile>
  idea: WorkIndexItem | null
  onClose: () => void
  onOpenClaim: () => void
  onOpenComplete: () => void
}

export function IdeaDetailsModal({
  authors,
  idea,
  onClose,
  onOpenClaim,
  onOpenComplete,
}: IdeaDetailsModalProps) {
  const router = useRouter()
  const status = idea?.idea?.status ?? 'open'
  const implementedHref =
    idea?.idea?.implementedWorkId && idea.idea.implementedWorkId.includes('/')
      ? `/works/${idea.idea.implementedWorkId.split('/')[0]}/${idea.idea.implementedWorkId.split('/')[1]}`
      : null

  return (
    <Modal
      isOpen={!!idea}
      onClose={onClose}
      title={idea?.title ?? ''}
      maxWidth="600px"
      footer={
        idea ? (
          <>
            <button
              className={`${modalStyles.modalBtn} ${modalStyles.secondary}`}
              onClick={onClose}
            >
              Close
            </button>

            {status === 'done' && implementedHref ? (
              <button
                className={`${modalStyles.modalBtn} ${modalStyles.primary}`}
                onClick={() => router.push(implementedHref)}
              >
                View Implementation
              </button>
            ) : (
              <>
                <button
                  className={`${modalStyles.modalBtn} ${modalStyles.secondary}`}
                  disabled={status !== 'open'}
                  onClick={onOpenClaim}
                >
                  Claim Idea
                </button>
                <button
                  className={`${modalStyles.modalBtn} ${modalStyles.primary}`}
                  disabled={status === 'done'}
                  onClick={onOpenComplete}
                >
                  I've Implemented This
                </button>
              </>
            )}

            {idea.idea?.pending && idea.idea.compareUrl ? (
              <button
                className={`${modalStyles.modalBtn} ${modalStyles.secondary}`}
                onClick={() => window.open(idea.idea?.compareUrl, '_blank', 'noreferrer')}
              >
                View Branch
              </button>
            ) : (
              <button
                className={`${modalStyles.modalBtn} ${modalStyles.secondary}`}
                onClick={() => router.push(`/works/${idea.authorId}/${idea.slug}`)}
              >
                Project Page
              </button>
            )}
          </>
        ) : null
      }
    >
      {idea ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <User size={14} />
              <span>{authors[idea.authorId]?.name ?? idea.authorId}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>{idea.date}</span>
            </div>
            <div className={styles.metaItem}>
              <span
                className={`${styles.statusBadge} ${
                  status === 'open'
                    ? styles.open
                    : status === 'in-progress'
                      ? styles.inProgress
                      : styles.completed
                }`}
              >
                {status === 'open'
                  ? 'Open'
                  : status === 'in-progress'
                    ? 'In Progress'
                    : 'Completed'}
              </span>
            </div>
          </div>

          <div className={styles.summary}>{idea.summary}</div>

          {idea.tags?.length ? (
            <div className={styles.tags}>
              {idea.tags.map((tag) => (
                <button
                  key={`tag:${tag}`}
                  onClick={() => {
                    onClose()
                    router.push(`/tags/${tag}`)
                  }}
                  className={styles.tagBtn}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}

          {idea.idea?.claimedBy && (
            <div className={styles.claimedBox}>
              <span className={styles.label}>Claimed by: </span>
              <span className={styles.value}>{idea.idea.claimedBy}</span>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
