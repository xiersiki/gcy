import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WorksHome } from './WorksHome'

describe('WorksHome', () => {
  it('renders title', () => {
    render(
      <WorksHome
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
