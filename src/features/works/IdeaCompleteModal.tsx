'use client'

import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'
import { Modal } from '@/components/Modal'
import modalStyles from '@/components/Modal.module.scss'

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; prUrl: string }
  | { status: 'error'; message: string }

export type IdeaCompleteModalProps = {
  open: boolean
  idea: WorkIndexItem | null
  authors: Record<string, AuthorProfile>
  onClose: () => void
}

export function IdeaCompleteModal({ open, idea, authors, onClose }: IdeaCompleteModalProps) {
  const authorIds = useMemo(
    () => Object.keys(authors).sort((a, b) => a.localeCompare(b)),
    [authors],
  )
  const [implementAuthorId, setImplementAuthorId] = useState(authorIds[0] ?? '')
  const [workType, setWorkType] = useState<'demo' | 'case-study'>('demo')
  const [workTitle, setWorkTitle] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  useEffect(() => {
    if (!open) return
    setSubmitState({ status: 'idle' })
    setImplementAuthorId((prev) => prev || authorIds[0] || '')
    setWorkType('demo')
    setWorkTitle('')
  }, [authorIds, open])

  async function submit() {
    if (!idea) return
    const authorId = implementAuthorId.trim()
    if (!authorId) {
      setSubmitState({ status: 'error', message: 'Please select an author' })
      return
    }
    setSubmitState({ status: 'submitting' })
    try {
      const res = await fetch('/api/ideas/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          implementAuthorId: authorId,
          workType,
          title: workTitle.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        throw new Error(`Failed to create completion PR (${res.status}): ${raw.slice(0, 100)}`)
      }
      const data = await res.json()
      const prUrl = data?.prUrl
      if (!prUrl) throw new Error('Completion successful but missing PR URL')
      setSubmitState({ status: 'success', prUrl })
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Submission failed',
      })
    }
  }

  const isDisabled =
    !idea || (idea.idea?.status ?? 'open') === 'done' || submitState.status === 'submitting'

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={idea ? `Complete Idea: ${idea.title}` : 'Submit Implementation'}
      footer={
        <>
          <button className={`${modalStyles.modalBtn} ${modalStyles.secondary}`} onClick={onClose}>
            Close
          </button>
          <button
            className={`${modalStyles.modalBtn} ${modalStyles.primary}`}
            disabled={isDisabled}
            onClick={submit}
          >
            {submitState.status === 'submitting' ? 'Creating PR...' : 'Create Completion PR'}
          </button>
        </>
      }
    >
      <div className={modalStyles.modalFormItem}>
        <label>Implementation Author</label>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
          The work will be created under this author's directory.
        </p>
        <select
          className={modalStyles.modalSelect}
          value={implementAuthorId}
          onChange={(e) => setImplementAuthorId(e.target.value)}
        >
          {authorIds.map((id) => (
            <option key={id} value={id}>
              {authors[id]?.name ?? id}
            </option>
          ))}
        </select>
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Work Type</label>
        <select
          className={modalStyles.modalSelect}
          value={workType}
          onChange={(e) => setWorkType(e.target.value as 'demo' | 'case-study')}
        >
          <option value="demo">Demo</option>
          <option value="case-study">Case Study</option>
        </select>
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Work Title (Optional)</label>
        <input
          className={modalStyles.modalInput}
          value={workTitle}
          onChange={(e) => setWorkTitle(e.target.value)}
          placeholder={idea?.title ?? 'Default to idea title'}
        />
      </div>

      {submitState.status === 'error' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.error}`}>
          {submitState.message}
        </div>
      )}

      {submitState.status === 'success' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.success}`}>
          Completion PR created:{' '}
          <a
            href={submitState.prUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            View PR
          </a>
          <br />
          (Takes effect after merging)
        </div>
      )}
    </Modal>
  )
}
