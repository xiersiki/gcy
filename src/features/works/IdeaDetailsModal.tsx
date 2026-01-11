'use client'

import { useRouter } from 'next/navigation'
import { Calendar, User } from 'lucide-react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'
import { Modal } from '@/components/Modal'
import modalStyles from '@/components/Modal.module.scss'

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
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              color: '#94a3b8',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={14} />
              <span>{authors[idea.authorId]?.name ?? idea.authorId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Calendar size={14} />
              <span>{idea.date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span
                style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.375rem',
                  background:
                    status === 'open'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : status === 'in-progress'
                        ? 'rgba(79, 70, 229, 0.1)'
                        : 'rgba(148, 163, 184, 0.1)',
                  color:
                    status === 'open'
                      ? '#34d399'
                      : status === 'in-progress'
                        ? '#a5b4fc'
                        : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {status === 'open'
                  ? 'Open'
                  : status === 'in-progress'
                    ? 'In Progress'
                    : 'Completed'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.9375rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            {idea.summary}
          </div>

          {idea.tags?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {idea.tags.map((tag) => (
                <button
                  key={`tag:${tag}`}
                  onClick={() => {
                    onClose()
                    router.push(`/tags/${tag}`)
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    padding: '0.25rem 0.625rem',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.color = '#94a3b8'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}

          {idea.idea?.claimedBy && (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(129, 140, 248, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(129, 140, 248, 0.1)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: '#94a3b8' }}>Claimed by: </span>
              <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{idea.idea.claimedBy}</span>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
