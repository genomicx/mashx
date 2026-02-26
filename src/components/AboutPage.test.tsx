import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutPage } from './AboutPage'

describe('AboutPage', () => {
  it('renders the about heading', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { name: 'About mashx' })).toBeInTheDocument()
  })

  it('renders the privacy note', () => {
    render(<AboutPage />)
    expect(
      screen.getByText(/no data leaves your machine/i),
    ).toBeInTheDocument()
  })

  it('renders the available databases section', () => {
    render(<AboutPage />)
    expect(
      screen.getByRole('heading', { name: 'Available Databases' }),
    ).toBeInTheDocument()
  })

  it('renders the how it works section', () => {
    render(<AboutPage />)
    expect(
      screen.getByRole('heading', { name: 'How it works' }),
    ).toBeInTheDocument()
  })

  it('renders author information', () => {
    render(<AboutPage />)
    expect(
      screen.getByRole('heading', { name: 'Nabil-Fareed Alikhan' }),
    ).toBeInTheDocument()
  })
})
