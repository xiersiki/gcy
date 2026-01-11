'use client'

import { Button, Modal, Space, Tag, Typography } from '@arco-design/web-react'
import { useRouter } from 'next/navigation'

import type { AuthorProfile, WorkIndexItem } from '@/models/content'

export type IdeaDetailsModalProps = {
  authors: Record<string, AuthorProfile>
  idea: WorkIndexItem | null
  onClose: () => void
}

export function IdeaDetailsModal({ authors, idea, onClose }: IdeaDetailsModalProps) {
  const router = useRouter()

  return (
    <Modal
      visible={!!idea}
      title={idea?.title ?? ''}
      footer={
        idea ? (
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/works/${idea.authorId}/${idea.slug}`)
              }}
            >
              去作品页
            </Button>
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
