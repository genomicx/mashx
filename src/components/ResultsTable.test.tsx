import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ResultsTable } from './ResultsTable'
import type { MashxResult } from '../mashx/types'

vi.mock('../mashx/export', () => ({
  exportCsv: vi.fn(),
}))

const mockResult: MashxResult = {
  hits: [
    {
      reference: 'GCF_000123.1',
      query: 'sample.fasta',
      distance: 0.001,
      pValue: 1e-20,
      sharedHashes: '990/1000',
      organism: 'Escherichia coli',
      taxId: '562',
    },
    {
      reference: 'GCF_000456.2',
      query: 'sample.fasta',
      distance: 0.1,
      pValue: 3e-10,
      sharedHashes: '800/1000',
      organism: 'Staphylococcus aureus',
      taxId: '1280',
    },
    {
      reference: 'GCF_000789.3',
      query: 'sample.fasta',
      distance: 0.2,
      pValue: 5e-5,
      sharedHashes: '500/1000',
      organism: 'Salmonella enterica',
      taxId: '28901',
    },
  ],
  queryFiles: ['sample.fasta'],
  databaseName: 'Test DB',
  ranAt: '2025-01-01T00:00:00.000Z',
  topN: 20,
}

describe('ResultsTable', () => {
  it('renders the results heading', () => {
    render(<ResultsTable result={mockResult} />)
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument()
  })

  it('renders all hit rows', () => {
    render(<ResultsTable result={mockResult} />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // header + 3 data rows
    expect(rows.length).toBe(4)
  })

  it('shows organism column when hits have organism data', () => {
    render(<ResultsTable result={mockResult} />)
    expect(screen.getByText('Escherichia coli')).toBeInTheDocument()
    expect(screen.getByText('Staphylococcus aureus')).toBeInTheDocument()
  })

  it('renders TaxID links to NCBI', () => {
    render(<ResultsTable result={mockResult} />)
    const link = screen.getByText('562').closest('a')
    expect(link).toHaveAttribute(
      'href',
      'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=562',
    )
  })

  it('renders Export CSV button', () => {
    render(<ResultsTable result={mockResult} />)
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument()
  })

  it('filters results by search text', () => {
    render(<ResultsTable result={mockResult} />)
    const filterInput = screen.getByPlaceholderText(/filter by name/i)
    fireEvent.change(filterInput, { target: { value: 'Escherichia' } })

    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // header + 1 filtered row
    expect(rows.length).toBe(2)
  })

  it('shows hit count', () => {
    render(<ResultsTable result={mockResult} />)
    expect(screen.getByText(/3 of 3 hits/)).toBeInTheDocument()
  })

  it('applies distance variant classes', () => {
    render(<ResultsTable result={mockResult} />)
    // 0.001 should be success (close)
    const closeBadge = screen.getByText('0.0010')
    expect(closeBadge.className).toContain('gx-badge--success')
    // 0.1 should be warning (medium)
    const medBadge = screen.getByText('0.1000')
    expect(medBadge.className).toContain('gx-badge--warning')
    // 0.2 should be error (far)
    const farBadge = screen.getByText('0.2000')
    expect(farBadge.className).toContain('gx-badge--error')
  })
})
