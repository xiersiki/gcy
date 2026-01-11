import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

import { WorksHome } from './WorksHome'

describe('WorksHome', () => {
  it('renders title', () => {
    render(
      <WorksHome
        authors={{
          gcy: {
            id: 'gcy',
            name: 'GCY',
          },
        }}
        categories={['All']}
        works={[
          {
            id: 'gcy/demo',
            authorId: 'gcy',
            slug: 'demo',
            title: 'Demo',
            summary: 'Summary',
            type: 'idea',
            date: '2026-01-01',
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: /selected works/i })).toBeInTheDocument()
  })
})
