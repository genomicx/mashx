import { useCallback, useEffect, useState } from 'react'
import { DATABASES } from '../mashx/databases'
import { isCached, evictDatabase } from '../mashx/dbCache'
import type { DatabaseSource } from '../mashx/types'

interface DatabaseSelectorProps {
  value: DatabaseSource | null
  onChange: (source: DatabaseSource | null) => void
  disabled: boolean
}

export function DatabaseSelector({ value, onChange, disabled }: DatabaseSelectorProps) {
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set())
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'preset' | 'upload'>('preset')

  // Check cache status for all preset databases on mount
  useEffect(() => {
    async function checkCache() {
      const results = await Promise.all(
        DATABASES.map(async (db) => ({
          id: db.id,
          cached: await isCached(db.url),
        })),
      )
      setCachedIds(new Set(results.filter((r) => r.cached).map((r) => r.id)))
    }
    checkCache()
  }, [])

  const handlePresetSelect = useCallback(
    (id: string) => {
      const db = DATABASES.find((d) => d.id === id)
      if (db) onChange({ type: 'preset', config: db })
    },
    [onChange],
  )

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      setUploadFile(file)
      if (file) onChange({ type: 'upload', file })
      else onChange(null)
    },
    [onChange],
  )

  const handleEvict = useCallback(
    async (e: React.MouseEvent, url: string, id: string) => {
      e.stopPropagation()
      await evictDatabase(url)
      setCachedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [],
  )

  return (
    <div className="db-selector">
      <div className="db-mode-tabs">
        <button
          className={`db-mode-tab ${mode === 'preset' ? 'active' : ''}`}
          onClick={() => setMode('preset')}
          disabled={disabled}
        >
          Preset Databases
        </button>
        <button
          className={`db-mode-tab ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
          disabled={disabled}
        >
          Upload .msh File
        </button>
      </div>

      {mode === 'preset' ? (
        <div className="db-list">
          {DATABASES.length === 0 && (
            <p className="db-empty">No databases configured. Add entries to <code>src/mashx/databases.ts</code>.</p>
          )}
          {DATABASES.map((db) => {
            const isSelected =
              value?.type === 'preset' && value.config.id === db.id
            const cached = cachedIds.has(db.id)
            return (
              <label key={db.id} className={`db-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="db-preset"
                  value={db.id}
                  checked={isSelected}
                  onChange={() => handlePresetSelect(db.id)}
                  disabled={disabled}
                />
                <div className="db-card-body">
                  <div className="db-card-header">
                    <span className="db-name">{db.name}</span>
                    <span className="db-version">{db.version}</span>
                    {cached && (
                      <span className="db-cached-badge" title="Cached in browser">
                        ✓ cached
                        <button
                          className="db-evict-btn"
                          onClick={(e) => handleEvict(e, db.url, db.id)}
                          title="Clear from cache"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="db-description">{db.description}</p>
                  <span className="db-size">~{(db.sizeBytes / 1_000_000).toFixed(0)} MB</span>
                </div>
              </label>
            )
          })}
        </div>
      ) : (
        <div className="db-upload-area">
          <label className="file-upload-area">
            <input
              type="file"
              accept=".msh"
              onChange={handleUpload}
              disabled={disabled}
            />
            <svg className="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploadFile ? (
              <div className="file-upload-label">{uploadFile.name}</div>
            ) : (
              <>
                <div className="file-upload-label">Drop a .msh file or click to browse</div>
                <div className="file-upload-hint">.msh sketch databases only</div>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}
