'use client'

import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile } from '@/models/content'
import type { IdeaIndexItem } from '@/models/idea'
import { Modal } from '@/components/Modal'
import modalStyles from '@/components/Modal.module.scss'
import { slugifyTitle } from '@/shared/slug'
import { readApiData } from '@/shared/api'

type IdeaFormDraft = {
  authorId: string
  title: string
  summary: string
  details: string
  tagsText: string
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; idea: IdeaIndexItem }
  | { status: 'error'; message: string }

export type IdeaPublishModalProps = {
  authors: Record<string, AuthorProfile>
  open: boolean
  onClose: () => void
  onPublished?: (idea: IdeaIndexItem) => void
}

function validateDraft(draft: IdeaFormDraft) {
  const authorId = draft.authorId.trim()
  const title = draft.title.trim()
  const summary = draft.summary.trim()
  if (!authorId) return { ok: false as const, message: 'Please select an author' }
  if (!title) return { ok: false as const, message: 'Please enter a title' }
  if (!summary) return { ok: false as const, message: 'Please enter a summary' }

  const tags = draft.tagsText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)

  const slug = slugifyTitle(title)

  return {
    ok: true as const,
    slug,
    payload: {
      authorId,
      title,
      summary,
      details: draft.details.trim(),
      tags,
    },
  }
}

export function IdeaPublishModal({ authors, open, onClose, onPublished }: IdeaPublishModalProps) {
  const authorIds = useMemo(
    () => Object.keys(authors).sort((a, b) => a.localeCompare(b)),
    [authors],
  )
  const [draft, setDraft] = useState<IdeaFormDraft>(() => ({
    authorId: authorIds[0] ?? '',
    title: '',
    summary: '',
    details: '',
    tagsText: '',
  }))
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [uploadList, setUploadList] = useState<{ file: File; url: string }[]>([])

  useEffect(() => {
    if (!open) return
    setSubmitState({ status: 'idle' })
    setUploadList([])
    setDraft((prev) => ({
      authorId: prev.authorId || authorIds[0] || '',
      title: '',
      summary: '',
      details: '',
      tagsText: '',
    }))
  }, [authorIds, open])

  useEffect(() => {
    if (open) return
    for (const it of uploadList) {
      if (it.url?.startsWith('blob:')) URL.revokeObjectURL(it.url)
    }
  }, [open, uploadList])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxBytes = 5 * 1024 * 1024

    const next = files
      .filter((f) => f.size <= maxBytes)
      .slice(0, 6 - uploadList.length)
      .map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }))

    setUploadList((prev) => [...prev, ...next])
    setSubmitState({ status: 'idle' })
  }

  const removeFile = (index: number) => {
    setUploadList((prev) => {
      const next = [...prev]
      const removed = next.splice(index, 1)[0]
      if (removed.url.startsWith('blob:')) URL.revokeObjectURL(removed.url)
      return next
    })
  }

  async function submit() {
    setSubmitState({ status: 'idle' })

    const validated = validateDraft(draft)
    if (!validated.ok) {
      setSubmitState({ status: 'error', message: validated.message })
      return
    }

    setSubmitState({ status: 'submitting' })
    try {
      const images = uploadList.map((it) => it.file)

      const res =
        images.length > 0
          ? await fetch('/api/ideas', {
              method: 'POST',
              body: (() => {
                const fd = new FormData()
                fd.append('payload', JSON.stringify(validated.payload))
                for (const file of images) fd.append('images', file, file.name)
                return fd
              })(),
            })
          : await fetch('/api/ideas', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(validated.payload),
            })

      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        throw new Error(`Submission failed (${res.status}): ${raw.slice(0, 100)}`)
      }

      const dto = await readApiData<{
        id: string
        authorId: string
        slug: string
        title: string
        summary: string
        details: string | null
        tags: string[]
        status: string
        createdAt: string
        claimedBy: string | null
        claimPrUrl: string | null
        imageUrls: string[]
      }>(res)
      if (!dto) throw new Error('Missing data in response')

      const statusRaw = String(dto.status || 'open')
      const statusNormalized =
        statusRaw === 'open' || statusRaw === 'in-progress' || statusRaw === 'done'
          ? statusRaw
          : 'open'

      const idea: IdeaIndexItem = {
        id: `${dto.authorId}/${dto.slug}`,
        authorId: dto.authorId,
        slug: dto.slug,
        title: dto.title,
        summary: dto.summary,
        date: (dto.createdAt || new Date().toISOString()).slice(0, 10),
        tags: dto.tags ?? validated.payload.tags,
        idea: {
          status: statusNormalized,
          claimedBy: dto.claimedBy ?? undefined,
          claimPrUrl: dto.claimPrUrl ?? undefined,
          pending: false,
        },
        source: 'supabase',
      }
      setSubmitState({ status: 'success', idea })
      onPublished?.(idea)
      setTimeout(onClose, 1500)
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Submission failed',
      })
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Publish New Idea"
      maxWidth="600px"
      footer={
        <>
          <button className={`${modalStyles.modalBtn} ${modalStyles.secondary}`} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${modalStyles.modalBtn} ${modalStyles.primary}`}
            disabled={submitState.status === 'submitting'}
            onClick={submit}
          >
            {submitState.status === 'submitting' ? 'Submitting...' : 'Publish Idea'}
          </button>
        </>
      }
    >
      <div className={modalStyles.modalFormItem}>
        <label>Author</label>
        <select
          className={modalStyles.modalSelect}
          value={draft.authorId}
          onChange={(e) => setDraft((prev) => ({ ...prev, authorId: e.target.value }))}
        >
          {authorIds.map((id) => (
            <option key={id} value={id}>
              {authors[id]?.name ?? id}
            </option>
          ))}
        </select>
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Title</label>
        <input
          className={modalStyles.modalInput}
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Briefly describe your idea"
        />
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Summary</label>
        <textarea
          className={modalStyles.modalInput}
          rows={3}
          value={draft.summary}
          onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
          placeholder="What problem does it solve? What are the key features?"
        />
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Details (Optional)</label>
        <textarea
          className={modalStyles.modalInput}
          rows={5}
          value={draft.details}
          onChange={(e) => setDraft((prev) => ({ ...prev, details: e.target.value }))}
          placeholder="Implementation tips, reference links, etc."
        />
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Tags (Optional, comma separated)</label>
        <input
          className={modalStyles.modalInput}
          value={draft.tagsText}
          onChange={(e) => setDraft((prev) => ({ ...prev, tagsText: e.target.value }))}
          placeholder="e.g. ui, animation, webgl"
        />
      </div>

      <div className={modalStyles.modalFormItem}>
        <label>Reference Images (Optional, max 6)</label>
        <div className={modalStyles.imageGrid}>
          {uploadList.map((it, idx) => (
            <div key={idx} className={modalStyles.imageItem}>
              <img src={it.url} alt="" />
              <button onClick={() => removeFile(idx)} className={modalStyles.removeBtn}>
                <X size={14} />
              </button>
            </div>
          ))}
          {uploadList.length < 6 && (
            <label className={modalStyles.uploadPlaceholder}>
              <Plus size={24} />
              <span>Upload</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>

      {submitState.status === 'error' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.error}`}>
          {submitState.message}
        </div>
      )}
      {submitState.status === 'success' && (
        <div className={`${modalStyles.modalAlert} ${modalStyles.success}`}>
          Idea published successfully!
        </div>
      )}
    </Modal>
  )
}
