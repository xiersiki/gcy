import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('renders title', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /selected/i })).toBeInTheDocument()
  })
})
