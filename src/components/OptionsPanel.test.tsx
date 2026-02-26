import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OptionsPanel } from './OptionsPanel'
import { DEFAULT_OPTIONS } from '../mashx/types'

describe('OptionsPanel', () => {
  it('renders all option fields', () => {
    render(
      <OptionsPanel options={DEFAULT_OPTIONS} onChange={() => {}} disabled={false} />,
    )
    expect(screen.getByText('Top N hits')).toBeInTheDocument()
    expect(screen.getByText('Sketch size (s)')).toBeInTheDocument()
    expect(screen.getByText('k-mer size (k)')).toBeInTheDocument()
  })

  it('displays current option values', () => {
    render(
      <OptionsPanel options={DEFAULT_OPTIONS} onChange={() => {}} disabled={false} />,
    )
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(20)
    expect(inputs[1]).toHaveValue(1000)
    expect(inputs[2]).toHaveValue(21)
  })

  it('calls onChange when topN is updated', () => {
    const onChange = vi.fn()
    render(
      <OptionsPanel options={DEFAULT_OPTIONS} onChange={onChange} disabled={false} />,
    )

    const topNInput = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(topNInput, { target: { value: '50' } })

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_OPTIONS,
      topN: 50,
    })
  })
})
