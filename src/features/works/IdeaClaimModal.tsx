'use client'

import { Alert, Button, Modal, Select, Space } from '@arco-design/web-react'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; prUrl: string }
  | { status: 'error'; message: string }

export type IdeaClaimModalProps = {
  open: boolean
  idea: WorkIndexItem | null
  authors: Record<string, AuthorProfile>
  onClose: () => void
}

export function IdeaClaimModal({ open, idea, authors, onClose }: IdeaClaimModalProps) {
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
      setSubmitState({ status: 'error', message: '请选择实现作者' })
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
      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        const detail = raw ? `：${raw.slice(0, 240)}` : ''
        throw new Error(`认领失败（${res.status}）${detail}`)
      }
      const data = (await res.json().catch(() => null)) as null | {
        ok?: boolean
        data?: { prUrl?: string }
      }
      const prUrl = data?.ok ? data?.data?.prUrl : null
      if (!prUrl) throw new Error('认领成功但缺少 prUrl 返回值')
      setSubmitState({ status: 'success', prUrl })
    } catch (err) {
      const message = err instanceof Error ? err.message : '认领失败'
      setSubmitState({ status: 'error', message })
    }
  }

  const isDisabled = !idea || (idea.idea?.status ?? 'open') !== 'open'

  return (
    <Modal
      visible={open}
      title={idea ? `认领点子：${idea.title}` : '认领点子'}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            disabled={isDisabled}
            loading={submitState.status === 'submitting'}
            onClick={submit}
          >
            创建认领 PR
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 6 }}>实现作者（会创建在该作者目录下）</div>
          <Select
            value={implementAuthorId}
            onChange={(v) => {
              setImplementAuthorId(String(v))
              setSubmitState({ status: 'idle' })
            }}
          >
            {authorIds.map((id) => (
              <Select.Option key={`impl-author:${id}`} value={id}>
                {authors[id]?.name ?? id}
              </Select.Option>
            ))}
          </Select>
        </div>

        {submitState.status === 'error' ? (
          <Alert type="error" content={submitState.message} />
        ) : null}
        {submitState.status === 'success' ? (
          <Alert
            type="success"
            content={
              <span>
                已创建认领 PR：{' '}
                <a href={submitState.prUrl} target="_blank" rel="noreferrer">
                  {submitState.prUrl}
                </a>
                （合并后生效）
              </span>
            }
          />
        ) : null}
      </Space>
    </Modal>
  )
}
