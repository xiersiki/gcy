'use client'

import { Alert, Button, Input, Modal, Select, Space, Upload } from '@arco-design/web-react'
import type { UploadItem } from '@arco-design/web-react/es/Upload'
import { useEffect, useMemo, useState } from 'react'

import type { AuthorProfile } from '@/models/content'

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
  | { status: 'success'; prUrl: string }
  | { status: 'error'; message: string }

export type IdeaPublishModalProps = {
  authors: Record<string, AuthorProfile>
  open: boolean
  onClose: () => void
}

function slugifyTitle(title: string) {
  const normalized = title
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'idea'
}

function validateDraft(draft: IdeaFormDraft) {
  const authorId = draft.authorId.trim()
  const title = draft.title.trim()
  const summary = draft.summary.trim()
  if (!authorId) return { ok: false as const, message: '请选择作者' }
  if (!title) return { ok: false as const, message: '请填写标题' }
  if (!summary) return { ok: false as const, message: '请填写一句话简介' }

  const tags = draft.tagsText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)

  const slug = slugifyTitle(title)
  const branch = `ideas/${authorId}/${slug}`

  return {
    ok: true as const,
    branch,
    payload: {
      authorId,
      title,
      summary,
      details: draft.details.trim(),
      tags,
    },
  }
}

export function IdeaPublishModal({ authors, open, onClose }: IdeaPublishModalProps) {
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
  const [checkResult, setCheckResult] = useState<{ ok: boolean; branch?: string } | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [uploadList, setUploadList] = useState<UploadItem[]>([])

  useEffect(() => {
    if (!open) return
    setSubmitState({ status: 'idle' })
    setCheckResult(null)
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

  async function submit() {
    setCheckResult(null)
    setSubmitState({ status: 'idle' })

    const validated = validateDraft(draft)
    if (!validated.ok) {
      setSubmitState({ status: 'error', message: validated.message })
      return
    }

    setSubmitState({ status: 'submitting' })
    try {
      const images = uploadList
        .map((it) => it.originFile)
        .filter((f): f is File => f instanceof File)

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
        const detail = raw ? `：${raw.slice(0, 240)}` : ''
        throw new Error(`提交失败（${res.status}）${detail}`)
      }
      const data = (await res.json().catch(() => null)) as null | { prUrl?: string }
      const prUrl = data?.prUrl
      if (!prUrl) throw new Error('提交成功但缺少 prUrl 返回值')
      setSubmitState({ status: 'success', prUrl })
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败'
      setSubmitState({ status: 'error', message })
    }
  }

  return (
    <Modal
      visible={open}
      title="发布点子"
      onCancel={onClose}
      footer={
        <Space>
          <Button
            onClick={() => {
              setSubmitState({ status: 'idle' })
              const validated = validateDraft(draft)
              if (!validated.ok) {
                setSubmitState({ status: 'error', message: validated.message })
                setCheckResult(null)
                return
              }
              setCheckResult({ ok: true, branch: validated.branch })
            }}
          >
            校验
          </Button>
          <Button type="primary" loading={submitState.status === 'submitting'} onClick={submit}>
            {submitState.status === 'submitting' ? '提交中…' : '提交并创建 PR'}
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 6 }}>作者</div>
          <Select
            value={draft.authorId}
            onChange={(v) => {
              setDraft((prev) => ({ ...prev, authorId: String(v) }))
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
          >
            {authorIds.map((id) => (
              <Select.Option key={`author:${id}`} value={id}>
                {authors[id]?.name ?? id}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>标题</div>
          <Input
            value={draft.title}
            onChange={(v) => {
              setDraft((prev) => ({ ...prev, title: v }))
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
            placeholder="一句话概括这个点子"
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>一句话简介</div>
          <Input.TextArea
            value={draft.summary}
            onChange={(v) => {
              setDraft((prev) => ({ ...prev, summary: v }))
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="这个点子想解决什么、有什么亮点"
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>更多说明（可选）</div>
          <Input.TextArea
            value={draft.details}
            onChange={(v) => {
              setDraft((prev) => ({ ...prev, details: v }))
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
            autoSize={{ minRows: 5, maxRows: 12 }}
            placeholder="建议包含：使用场景、参考链接、实现提示、验收标准等"
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>标签（逗号分隔，可选）</div>
          <Input
            value={draft.tagsText}
            onChange={(v) => {
              setDraft((prev) => ({ ...prev, tagsText: v }))
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
            placeholder="比如: ui, animation, webgl"
          />
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>参考图片（可选，最多 6 张）</div>
          <Upload
            listType="picture-card"
            accept="image/*"
            multiple
            limit={6}
            autoUpload={false}
            fileList={uploadList}
            onChange={(fileList) => {
              const maxBytes = 5 * 1024 * 1024
              const next = (fileList ?? [])
                .filter((it) => {
                  const f = it.originFile
                  if (f instanceof File && f.size > maxBytes) return false
                  return true
                })
                .slice(0, 6)
                .map((it) => {
                  if (!it.url && it.originFile instanceof File) {
                    return { ...it, url: URL.createObjectURL(it.originFile) }
                  }
                  return it
                })
              setUploadList(next)
              setSubmitState({ status: 'idle' })
              setCheckResult(null)
            }}
            onRemove={(file) => {
              if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url)
              return true
            }}
          />
          <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6 }}>
            用于描述目标效果（超过 5MB 的图片会被忽略）。
          </div>
        </div>

        {checkResult ? (
          <Alert
            type={checkResult.ok ? 'success' : 'error'}
            content={checkResult.ok ? `校验通过，将创建分支：${checkResult.branch}` : '校验未通过'}
          />
        ) : null}

        {submitState.status === 'error' ? (
          <Alert type="error" content={submitState.message} />
        ) : null}
        {submitState.status === 'success' ? (
          <Alert
            type="success"
            content={
              <span>
                已创建 PR：{' '}
                <a href={submitState.prUrl} target="_blank" rel="noreferrer">
                  {submitState.prUrl}
                </a>
              </span>
            }
          />
        ) : null}
      </Space>
    </Modal>
  )
}
