import { useState, useMemo, useCallback } from 'react'
import { StatusBadge } from '@genomicx/ui'
import type { MashxResult } from '../mashx/types'
import { exportCsv } from '../mashx/export'

interface ResultsTableProps {
  result: MashxResult
}

type SortKey = 'distance' | 'pValue' | 'sharedHashes' | 'reference' | 'organism'
type SortDir = 'asc' | 'desc'

export function ResultsTable({ result }: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('distance')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filter, setFilter] = useState('')

  const hasOrganism = result.hits.some((h) => h.organism)

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey],
  )

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return result.hits.filter(
      (h) =>
        !q ||
        h.reference.toLowerCase().includes(q) ||
        (h.organism ?? '').toLowerCase().includes(q) ||
        (h.taxId ?? '').includes(q),
    )
  }, [result.hits, filter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'distance':
          cmp = a.distance - b.distance
          break
        case 'pValue':
          cmp = a.pValue - b.pValue
          break
        case 'sharedHashes': {
          const aNum = parseInt(a.sharedHashes.split('/')[0], 10)
          const bNum = parseInt(b.sharedHashes.split('/')[0], 10)
          cmp = bNum - aNum // higher shared = better, default desc
          break
        }
        case 'reference':
          cmp = a.reference.localeCompare(b.reference)
          break
        case 'organism':
          cmp = (a.organism ?? '').localeCompare(b.organism ?? '')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function arrow(key: SortKey) {
    if (sortKey !== key) return <span className="sort-arrow inactive">↕</span>
    return <span className="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function distanceVariant(d: number): 'success' | 'warning' | 'error' {
    if (d < 0.05) return 'success'
    if (d < 0.15) return 'warning'
    return 'error'
  }

  return (
    <section className="results">
      <div className="results-header">
        <div>
          <h2>Results</h2>
          <p className="results-meta">
            {result.databaseName} &mdash; {result.queryFiles.join(', ')} &mdash;{' '}
            {new Date(result.ranAt).toLocaleString()}
          </p>
        </div>
        <div className="results-actions">
          <input
            className="results-filter"
            type="search"
            placeholder="Filter by name, organism, taxid…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter results"
          />
          <button className="export-button" onClick={() => exportCsv(result)}>
            Export CSV
          </button>
        </div>
      </div>

      <p className="results-count">
        {sorted.length} of {result.hits.length} hits
        {filter && ` matching "${filter}"`}
      </p>

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="sortable" onClick={() => handleSort('reference')}>
                Reference {arrow('reference')}
              </th>
              {hasOrganism && (
                <th className="sortable" onClick={() => handleSort('organism')}>
                  Organism {arrow('organism')}
                </th>
              )}
              {hasOrganism && <th>TaxID</th>}
              <th className="sortable" onClick={() => handleSort('distance')}>
                Distance {arrow('distance')}
              </th>
              <th className="sortable" onClick={() => handleSort('pValue')}>
                P-Value {arrow('pValue')}
              </th>
              <th className="sortable" onClick={() => handleSort('sharedHashes')}>
                Shared Hashes {arrow('sharedHashes')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((hit, i) => (
              <tr key={`${hit.reference}-${hit.query}-${i}`}>
                <td className="row-num">{i + 1}</td>
                <td className="ref-id">{hit.reference}</td>
                {hasOrganism && <td>{hit.organism ?? '—'}</td>}
                {hasOrganism && (
                  <td>
                    {hit.taxId ? (
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${hit.taxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="taxid-link"
                      >
                        {hit.taxId}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                <td>
                  <StatusBadge variant={distanceVariant(hit.distance)}>
                    {hit.distance.toFixed(4)}
                  </StatusBadge>
                </td>
                <td className="mono">{hit.pValue.toExponential(2)}</td>
                <td className="mono">{hit.sharedHashes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
