import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { About } from '../pages/About'

function renderAbout() {
  return render(<MemoryRouter><About /></MemoryRouter>)
}

describe('AboutPage', () => {
  it('renders the about heading', () => {
    renderAbout()
    expect(screen.getByRole('heading', { name: 'About MashX' })).toBeInTheDocument()
  })

  it('renders the privacy note', () => {
    renderAbout()
    expect(
      screen.getByText(/no data leaves your machine/i),
    ).toBeInTheDocument()
  })

  it('renders the available databases section', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { name: 'Available Databases' }),
    ).toBeInTheDocument()
  })

  it('renders the how it works section', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { name: 'How it works' }),
    ).toBeInTheDocument()
  })

  it('renders author information', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { name: 'Nabil-Fareed Alikhan' }),
    ).toBeInTheDocument()
  })
})
