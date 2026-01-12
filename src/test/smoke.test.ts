import { describe, expect, it } from 'vitest'

import { ensureSafeId } from '../shared/id'
import { slugifyTitle } from '../shared/slug'

describe('shared utils', () => {
  it('slugifyTitle uses fallback', () => {
    expect(slugifyTitle('')).toBe('idea')
    expect(slugifyTitle('', { fallback: 'work' })).toBe('work')
  })

  it('ensureSafeId normalizes', () => {
    expect(ensureSafeId('  AbC__-123  ', 'id')).toBe('abc-123')
  })
})
