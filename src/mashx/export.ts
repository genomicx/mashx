import { saveAs } from 'file-saver'
import type { MashxResult } from './types'

export function exportCsv(result: MashxResult): void {
  const headers = [
    'Reference',
    'Query',
    'Distance',
    'P-Value',
    'Shared Hashes',
    'Organism',
    'TaxID',
  ]

  const rows = result.hits.map((h) => [
    h.reference,
    h.query,
    h.distance.toFixed(6),
    h.pValue.toExponential(3),
    h.sharedHashes,
    h.organism ?? '',
    h.taxId ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const timestamp = new Date().toISOString().slice(0, 10)
  saveAs(blob, `mashx-results-${timestamp}.csv`)
}
