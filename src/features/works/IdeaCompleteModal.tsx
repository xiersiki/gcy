'use client'

import { Alert, Button, Input, Modal, Select, Space } from '@arco-design/web-react'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

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
      setSubmitState({ status: 'error', message: '请选择实现作者' })
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
        const detail = raw ? `：${raw.slice(0, 240)}` : ''
        throw new Error(`创建完成 PR 失败（${res.status}）${detail}`)
      }
      const data = (await res.json().catch(() => null)) as null | { prUrl?: string }
      const prUrl = data?.prUrl
      if (!prUrl) throw new Error('创建成功但缺少 prUrl 返回值')
      setSubmitState({ status: 'success', prUrl })
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建失败'
      setSubmitState({ status: 'error', message })
    }
  }

  const isDisabled =
    !idea || (idea.idea?.status ?? 'open') === 'done' || submitState.status === 'submitting'

  return (
    <Modal
      visible={open}
      title={idea ? `提交实现：${idea.title}` : '提交实现'}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" disabled={isDisabled} onClick={submit}>
            创建完成 PR
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

        <div>
          <div style={{ marginBottom: 6 }}>作品类型</div>
          <Select
            value={workType}
            onChange={(v) => {
              setWorkType(v as 'demo' | 'case-study')
              setSubmitState({ status: 'idle' })
            }}
          >
            <Select.Option value="demo">demo</Select.Option>
            <Select.Option value="case-study">case-study</Select.Option>
          </Select>
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>作品标题（可选，默认使用点子标题）</div>
          <Input
            value={workTitle}
            onChange={(v) => {
              setWorkTitle(v)
              setSubmitState({ status: 'idle' })
            }}
            placeholder={idea?.title ?? ''}
          />
        </div>

        {submitState.status === 'error' ? (
          <Alert type="error" content={submitState.message} />
        ) : null}
        {submitState.status === 'success' ? (
          <Alert
            type="success"
            content={
              <span>
                已创建完成 PR：{' '}
                <a href={submitState.prUrl} target="_blank" rel="noreferrer">
                  {submitState.prUrl}
                </a>
                （合并后会上线并出现在作品区）
              </span>
            }
          />
        ) : null}
      </Space>
    </Modal>
  )
}
