import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MashxResult } from './types'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

import { exportCsv } from './export'
import { saveAs } from 'file-saver'

const mockedSaveAs = saveAs as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockedSaveAs.mockClear()
})

describe('exportCsv', () => {
  it('generates CSV with correct headers and rows', () => {
    const result: MashxResult = {
      hits: [
        {
          reference: 'GCF_000123.1',
          query: 'sample.fasta',
          distance: 0.001234,
          pValue: 1.5e-20,
          sharedHashes: '990/1000',
          organism: 'E. coli',
          taxId: '562',
        },
        {
          reference: 'GCF_000456.2',
          query: 'sample.fasta',
          distance: 0.05,
          pValue: 3.2e-10,
          sharedHashes: '800/1000',
        },
      ],
      queryFiles: ['sample.fasta'],
      databaseName: 'Test DB',
      ranAt: '2025-01-01T00:00:00.000Z',
      topN: 20,
    }

    exportCsv(result)

    expect(mockedSaveAs).toHaveBeenCalledOnce()
    const [blob, filename] = mockedSaveAs.mock.calls[0]

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/csv;charset=utf-8;')
    expect(filename).toMatch(/^mashx-results-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('escapes double quotes in CSV cells', () => {
    // Spy on Blob constructor to capture the CSV string
    let capturedCsv = ''
    const OrigBlob = globalThis.Blob
    globalThis.Blob = class extends OrigBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options)
        capturedCsv = String(parts[0])
      }
    } as typeof Blob

    const result: MashxResult = {
      hits: [
        {
          reference: 'ref with "quotes"',
          query: 'q.fasta',
          distance: 0,
          pValue: 0,
          sharedHashes: '1/1',
        },
      ],
      queryFiles: ['q.fasta'],
      databaseName: 'Test',
      ranAt: '2025-01-01T00:00:00.000Z',
      topN: 1,
    }

    exportCsv(result)
    globalThis.Blob = OrigBlob

    expect(capturedCsv).toContain('""quotes""')
  })
})
