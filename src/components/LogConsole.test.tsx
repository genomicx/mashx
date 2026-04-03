import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogConsole } from '@genomicx/ui'

describe('LogConsole', () => {
  it('renders empty state when logs array is empty', () => {
    render(<LogConsole logs={[]} />)
    expect(screen.getByText(/no logs yet/i)).toBeInTheDocument()
  })

  it('renders log lines', () => {
    const logs = ['[MashX] Starting...', '[MashX] Done.']
    render(<LogConsole logs={logs} />)
    expect(screen.getByText(/Starting\.\.\./)).toBeInTheDocument()
    expect(screen.getByText(/Done\./)).toBeInTheDocument()
  })

  it('renders a copy log button', () => {
    render(<LogConsole logs={['test']} />)
    expect(screen.getByText(/copy/i)).toBeInTheDocument()
  })
})
