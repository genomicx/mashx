import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileUpload } from '@genomicx/ui'

describe('FileUpload', () => {
  it('renders drop zone prompt when no files selected', () => {
    render(<FileUpload files={[]} onFilesChange={() => {}} />)
    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument()
  })

  it('shows file count when one file is selected', () => {
    const files = [new File([''], 'sample.fasta')]
    render(<FileUpload files={files} onFilesChange={() => {}} />)
    expect(screen.getByText('1 file selected')).toBeInTheDocument()
  })

  it('shows plural file count when multiple files selected', () => {
    const files = [new File([''], 'sample1.fasta'), new File([''], 'sample2.fa')]
    render(<FileUpload files={files} onFilesChange={() => {}} />)
    expect(screen.getByText('2 files selected')).toBeInTheDocument()
  })

  it('lists selected filenames', () => {
    const files = [new File([''], 'sample1.fasta'), new File([''], 'sample2.fa')]
    render(<FileUpload files={files} onFilesChange={() => {}} />)
    expect(screen.getByText('sample1.fasta')).toBeInTheDocument()
    expect(screen.getByText('sample2.fa')).toBeInTheDocument()
  })

  it('disables file input when disabled', () => {
    render(<FileUpload files={[]} onFilesChange={() => {}} disabled={true} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeDisabled()
  })
})
