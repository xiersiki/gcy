import { describe, expect, it } from 'vitest'

import { mapIdeaRowToIndexItem, normalizeIdeaStatus } from '../shared/ideas/mapper'

describe('shared/ideas/mapper', () => {
  it('normalizes status', () => {
    expect(normalizeIdeaStatus('open')).toBe('open')
    expect(normalizeIdeaStatus('in-progress')).toBe('in-progress')
    expect(normalizeIdeaStatus('done')).toBe('done')
    expect(normalizeIdeaStatus('weird')).toBe('open')
  })

  it('maps supabase row into IdeaIndexItem', () => {
    const item = mapIdeaRowToIndexItem({
      author_id: 'gcy',
      slug: 'comment',
      title: 't',
      summary: 's',
      created_at: '2026-01-01T00:00:00Z',
      status: 'open',
      tags: [' ui ', ' ', 'web', 123],
      claimed_by: 'alice',
      claim_pr_url: 'https://example.com/pr',
      pending: true,
      compare_url: 'https://example.com/compare',
    })

    expect(item.id).toBe('gcy/comment')
    expect(item.authorId).toBe('gcy')
    expect(item.slug).toBe('comment')
    expect(item.date).toBe('2026-01-01')
    expect(item.tags).toEqual(['ui', 'web', '123'])
    expect(item.idea.status).toBe('open')
    expect(item.idea.claimedBy).toBe('alice')
    expect(item.idea.claimPrUrl).toBe('https://example.com/pr')
    expect(item.idea.pending).toBe(true)
    expect(item.idea.compareUrl).toBe('https://example.com/compare')
    expect(item.source).toBe('supabase')
  })
})
