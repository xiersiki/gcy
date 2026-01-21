'use client'

import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile } from '@/models/content'
import type { IdeaIndexItem } from '@/models/idea'
import { Modal } from '@/components/Modal'
import modalStyles from '@/components/Modal.module.scss'
import { readApiData } from '@/shared/api'

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; prUrl: string }
  | { status: 'error'; message: string }

export type IdeaClaimModalProps = {
  open: boolean
  idea: IdeaIndexItem | null
  authors: Record<string, AuthorProfile>
  onClose: () => void
  onSubmitted?: () => void
}

export function IdeaClaimModal({ open, idea, authors, onClose, onSubmitted }: IdeaClaimModalProps) {
  const authorIds = useMemo(
    () => Object.keys(authors).sort((a, b) => a.localeCompare(b)),
    [authors],
  )
  const [implementAuthorId, setImplementAuthorId] = useState(authorIds[0] ?? '')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  useEffect(() => {
    if (!open) return
    setSubmitState({ status: 'idle' })
    setImplementAuthorId((prev) => prev || authorIds[0] || '')
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
      const res = await fetch('/api/ideas/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          authorId: idea.authorId,
          slug: idea.slug,
          implementAuthorId: authorId,
        }),
      })
      const data = await readApiData<{ prUrl: string }>(res)
      const prUrl = data?.prUrl ?? null
      if (!prUrl) throw new Error('Claim successful but missing PR URL')
      setSubmitState({ status: 'success', prUrl })
      onSubmitted?.()
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Claim failed',
      })
    }
  }

  const isDisabled = !idea || idea.idea.status !== 'open'

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={idea ? `Claim Idea: ${idea.title}` : 'Claim Idea'}
      footer={
        <>
          <button className={`${modalStyles.modalBtn} ${modalStyles.secondary}`} onClick={onClose}>
            Close
          </button>
          <button
            className={`${modalStyles.modalBtn} ${modalStyles.primary}`}
            disabled={isDisabled || submitState.status === 'submitting'}
            onClick={submit}
          >
            {submitState.status === 'submitting' ? 'Creating PR...' : 'Create Claim PR'}
          </button>
        </>
      }
    >
      <div className={modalStyles.modalFormItem}>
        <label>Implementation Author</label>
        <p className={modalStyles.modalHelpText}>
          The project will be created under this author's directory.
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

      {submitState.status === 'error' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.error}`}>
          {submitState.message}
        </div>
      )}

      {submitState.status === 'success' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.success}`}>
          Claim PR created:{' '}
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
