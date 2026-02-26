import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogConsole } from './LogConsole'

describe('LogConsole', () => {
  it('renders nothing when lines array is empty', () => {
    const { container } = render(<LogConsole lines={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders log lines', () => {
    const lines = ['[MashX] Starting...', '[MashX] Done.']
    render(<LogConsole lines={lines} />)

    expect(screen.getByText(/Starting\.\.\./)).toBeInTheDocument()
    expect(screen.getByText(/Done\./)).toBeInTheDocument()
  })

  it('shows the entry count', () => {
    render(<LogConsole lines={['line1', 'line2', 'line3']} />)
    expect(screen.getByText('3 entries')).toBeInTheDocument()
  })

  it('renders a copy log button', () => {
    render(<LogConsole lines={['test']} />)
    expect(screen.getByText('Copy Log')).toBeInTheDocument()
  })
})
