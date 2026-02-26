import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileUpload } from './FileUpload'

describe('FileUpload', () => {
  it('renders the upload prompt when no files selected', () => {
    render(<FileUpload files={[]} onFilesChange={() => {}} disabled={false} />)
    expect(
      screen.getByText('Drop query genomes or click to browse'),
    ).toBeInTheDocument()
    expect(screen.getByText('.fasta, .fa, .fna, .fsa, .gz')).toBeInTheDocument()
  })

  it('renders file count and names when files are selected', () => {
    const files = [
      new File([''], 'sample1.fasta'),
      new File([''], 'sample2.fa'),
    ]
    render(<FileUpload files={files} onFilesChange={() => {}} disabled={false} />)
    expect(screen.getByText('2 file(s) selected')).toBeInTheDocument()
    expect(screen.getByText('sample1.fasta')).toBeInTheDocument()
    expect(screen.getByText('sample2.fa')).toBeInTheDocument()
  })

  it('has accessible file input', () => {
    render(<FileUpload files={[]} onFilesChange={() => {}} disabled={false} />)
    const inputs = screen.getAllByLabelText('Upload query genome files')
    expect(inputs.length).toBeGreaterThan(0)
  })
})
