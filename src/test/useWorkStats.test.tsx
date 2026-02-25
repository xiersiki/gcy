import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mutateWorkStats, useWorkStats } from '@/features/works/hooks/useWorkStats'

describe('useWorkStats', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not keep stale fetched data after key changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )

    mutateWorkStats('gcy', 'a', { likeCount: 1, bookmarkCount: 0, commentCount: 0 })

    const { result, rerender } = renderHook(({ authorId, slug }) => useWorkStats(authorId, slug), {
      initialProps: { authorId: 'gcy', slug: 'a' },
    })

    expect(result.current.data?.likeCount).toBe(1)
    expect(result.current.loading).toBe(false)

    rerender({ authorId: 'gcy', slug: 'b' })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(true)
  })
})
