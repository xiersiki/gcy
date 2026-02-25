import { describe, expect, it } from 'vitest'

import { categories, tagsIndex, worksList } from '../generated/content'

describe('generated content index', () => {
  it('contains enough non-draft works and type distribution', () => {
    const published = worksList.filter((w) => !w.draft)
    const newWorks = published.filter((w) => w.id !== 'gcy/comment' && w.id !== 'gcy/demo2')

    expect(newWorks.length).toBeGreaterThanOrEqual(8)

    const byType = newWorks.reduce(
      (acc, w) => {
        acc[w.type] = (acc[w.type] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    expect(byType['case-study'] ?? 0).toBeGreaterThanOrEqual(2)
    expect(byType.demo ?? 0).toBeGreaterThanOrEqual(4)
    expect(byType.snippet ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('keeps discoverability dimensions stable', () => {
    const published = worksList.filter((w) => !w.draft)
    expect(published.length).toBeGreaterThan(0)
    const covered = published.filter((w) =>
      Boolean(w.cover || w.external?.repoUrl || w.external?.demoUrl),
    )
    const tagNames = Object.keys(tagsIndex)

    expect(covered.length / published.length).toBeGreaterThanOrEqual(0.8)
    expect(tagNames.length).toBeGreaterThanOrEqual(6)
    expect(categories.length).toBeGreaterThanOrEqual(3)
  })

  it('enforces extended metadata on all published works', () => {
    for (const work of worksList.filter((w) => !w.draft)) {
      expect(work.summary.trim().length).toBeGreaterThanOrEqual(20)
      expect(/^\d{4}-\d{2}-\d{2}$/.test(work.date)).toBe(true)
      if (work.tags?.length) {
        expect(new Set(work.tags).size).toBe(work.tags.length)
      }
      if (work.featured != null) {
        expect(typeof work.featured).toBe('boolean')
      }
      if (work.difficulty != null) {
        expect(['beginner', 'intermediate', 'advanced']).toContain(work.difficulty)
      }
    }
  })
})
