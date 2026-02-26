import { useState, useEffect, useCallback } from 'react'
import { FileUpload } from './components/FileUpload'
import { LogConsole } from './components/LogConsole'
import { AboutPage } from './components/AboutPage'
import { DatabaseSelector } from './components/DatabaseSelector'
import { ResultsTable } from './components/ResultsTable'
import { OptionsPanel } from './components/OptionsPanel'
import { runMashx } from './mashx/pipeline'
import { DEFAULT_OPTIONS } from './mashx/types'
import type { MashxResult, MashxOptions, DatabaseSource } from './mashx/types'
import './App.css'

type Theme = 'light' | 'dark'
type View = 'analysis' | 'about'

function App() {
  const [queryFiles, setQueryFiles] = useState<File[]>([])
  const [dbSource, setDbSource] = useState<DatabaseSource | null>(null)
  const [options, setOptions] = useState<MashxOptions>(DEFAULT_OPTIONS)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState('')
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<MashxResult | null>(null)
  const [currentView, setCurrentView] = useState<View>('analysis')

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('gx-theme') as Theme) || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gx-theme', theme)
  }, [theme])

  const handleRun = useCallback(async () => {
    if (queryFiles.length === 0 || !dbSource) return

    setRunning(true)
    setError('')
    setResult(null)
    setLogLines([])
    setProgress('Starting...')
    setProgressPct(0)

    try {
      const res = await runMashx(
        queryFiles,
        dbSource,
        options,
        (msg, pct) => {
          setProgress(msg)
          setProgressPct(pct)
        },
        (msg) => setLogLines((prev) => [...prev, msg]),
      )
      setResult(res)
      setProgress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [queryFiles, dbSource, options])

  const canRun = queryFiles.length > 0 && dbSource !== null && !running

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>mashx</h1>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
        <p className="subtitle">Browser-based Mash distance — no data leaves your machine</p>
        <nav className="tab-bar">
          <button
            className={`tab ${currentView === 'analysis' ? 'tab-active' : ''}`}
            onClick={() => setCurrentView('analysis')}
          >
            Analysis
          </button>
          <button
            className={`tab ${currentView === 'about' ? 'tab-active' : ''}`}
            onClick={() => setCurrentView('about')}
          >
            About
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'analysis' ? (
          <>
            {/* Top controls row */}
            <div className="controls-row">
              <FileUpload
                files={queryFiles}
                onFilesChange={setQueryFiles}
                disabled={running}
              />
              <OptionsPanel
                options={options}
                onChange={setOptions}
                disabled={running}
              />
            </div>

            {/* Database selector — full width */}
            <DatabaseSelector
              value={dbSource}
              onChange={setDbSource}
              disabled={running}
            />

            <button
              className="run-button"
              onClick={handleRun}
              disabled={!canRun}
            >
              {running ? 'Running…' : 'Run Mash Distance'}
            </button>

            {running && (
              <section className="progress" aria-live="polite">
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="progress-text">{progress}</p>
              </section>
            )}

            {error && (
              <section className="error" role="alert">
                <p>{error}</p>
              </section>
            )}

            {result && <ResultsTable result={result} />}

            {logLines.length > 0 && <LogConsole lines={logLines} />}
          </>
        ) : (
          <AboutPage />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>GenomicX — open-source bioinformatics for the browser</span>
          <div className="footer-links">
            <a href="https://github.com/genomicx" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://genomicx.vercel.app/about" target="_blank" rel="noopener noreferrer">Mission</a>
            <a href="https://www.happykhan.com/" target="_blank" rel="noopener noreferrer">Nabil-Fareed Alikhan</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
