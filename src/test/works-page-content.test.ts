import { describe, expect, it } from 'vitest'

import {
  normalizeCategoryOptions,
  parseWorkFilterStateFromSearchParams,
  toWorkFilterSearchParams,
} from '@/features/works/WorksPageContent'

describe('normalizeCategoryOptions', () => {
  it('always keeps "All" as the first category', () => {
    expect(normalizeCategoryOptions([])).toEqual(['All'])
    expect(normalizeCategoryOptions(['Case Study', 'Snippet'])).toEqual([
      'All',
      'Case Study',
      'Snippet',
    ])
  })

  it('deduplicates category values while preserving insertion order', () => {
    expect(normalizeCategoryOptions(['All', 'Demo', 'Demo', 'Engineering'])).toEqual([
      'All',
      'Demo',
      'Engineering',
    ])
  })

  it('parses filter state from search params with safe defaults', () => {
    const categories = normalizeCategoryOptions(['Case Study'])
    const state = parseWorkFilterStateFromSearchParams(
      new URLSearchParams('category=Case Study&featured=1&difficulty=beginner'),
      categories,
    )
    expect(state).toEqual({
      category: 'Case Study',
      featured: true,
      difficulty: 'beginner',
    })
  })

  it('serializes defaults by omitting noop query values', () => {
    expect(
      toWorkFilterSearchParams({
        category: 'All',
        featured: false,
        difficulty: 'all',
      }).toString(),
    ).toBe('')
    expect(
      toWorkFilterSearchParams({
        category: 'Case Study',
        featured: true,
        difficulty: 'advanced',
      }).toString(),
    ).toBe('category=Case+Study&featured=1&difficulty=advanced')
  })
})
