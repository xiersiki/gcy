import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCommunityIdeas } from '../features/ideas/hooks/useCommunityIdeas'
import type { IdeaIndexItem } from '../models/idea'

describe('useCommunityIdeas', () => {
  it('keeps existing ideas on refresh failure', async () => {
    const initialIdeas: IdeaIndexItem[] = [
      {
        id: 'idea-1',
        authorId: 'gcy',
        slug: 'test',
        title: 'Test',
        summary: 'Summary',
        date: '2026-01-01',
        idea: { status: 'open' },
        source: 'content',
      },
    ]

    const fetchMock = vi.fn().mockRejectedValue(new Error('network'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useCommunityIdeas(initialIdeas))

    await waitFor(() => {
      expect(result.current.error).toBe('刷新失败：请稍后重试')
    })

    expect(result.current.ideas).toHaveLength(1)
    expect(result.current.ideas[0].id).toBe('idea-1')

    vi.unstubAllGlobals()
  })
})
