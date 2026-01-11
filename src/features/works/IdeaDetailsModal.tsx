'use client'

import { Button, Modal, Space, Tag, Typography } from '@arco-design/web-react'
import { useRouter } from 'next/navigation'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

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
      visible={!!idea}
      title={idea?.title ?? ''}
      footer={
        idea ? (
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button
              disabled={status !== 'open'}
              onClick={() => {
                onOpenClaim()
              }}
            >
              认领
            </Button>
            <Button
              type="primary"
              disabled={status === 'done'}
              onClick={() => {
                onOpenComplete()
              }}
            >
              我已实现
            </Button>
            {status === 'done' && implementedHref ? (
              <Button
                onClick={() => {
                  router.push(implementedHref)
                }}
              >
                查看实现作品
              </Button>
            ) : null}
            {idea.idea?.pending && idea.idea.compareUrl ? (
              <Button
                onClick={() => {
                  window.open(idea.idea?.compareUrl, '_blank', 'noreferrer')
                }}
              >
                查看分支
              </Button>
            ) : (
              <Button
                onClick={() => {
                  router.push(`/works/${idea.authorId}/${idea.slug}`)
                }}
              >
                去作品页
              </Button>
            )}
          </Space>
        ) : null
      }
      onCancel={onClose}
    >
      {idea ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            作者：{authors[idea.authorId]?.name ?? idea.authorId} · 日期：{idea.date} · 类型：idea
          </Typography.Text>
          <Typography.Text type="secondary">
            状态：
            {status === 'open' ? '可认领' : status === 'in-progress' ? '进行中' : '已实现'}
            {idea.idea?.claimedBy ? ` · 认领人：${idea.idea.claimedBy}` : ''}
          </Typography.Text>
          <Typography.Paragraph style={{ marginBottom: 0 }}>{idea.summary}</Typography.Paragraph>
          {idea.tags?.length ? (
            <Space wrap>
              {idea.tags.map((tag) => (
                <Tag
                  key={`idea:${idea.id}:tag:${tag}`}
                  onClick={() => {
                    router.push(`/tags/${tag}`)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          ) : null}
        </Space>
      ) : null}
    </Modal>
  )
}
