import { describe, expect, it } from 'vitest'

import { parseWorkDetailTab } from '@/features/works/WorkDetailClient'

describe('parseWorkDetailTab', () => {
  it('accepts supported tabs', () => {
    expect(parseWorkDetailTab('preview')).toBe('preview')
    expect(parseWorkDetailTab('docs')).toBe('docs')
    expect(parseWorkDetailTab('comments')).toBe('comments')
  })

  it('falls back to preview for invalid values', () => {
    expect(parseWorkDetailTab('unknown')).toBe('preview')
    expect(parseWorkDetailTab(null)).toBe('preview')
  })
})
