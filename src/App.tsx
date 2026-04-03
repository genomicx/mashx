import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { NavBar, AppFooter, LogConsole, FileUpload, ProgressBar } from '@genomicx/ui'
import { DatabaseSelector } from './components/DatabaseSelector'
import { ResultsTable } from './components/ResultsTable'
import { OptionsPanel } from './components/OptionsPanel'
import { About } from './pages/About'
import { runMashx } from './mashx/pipeline'
import { DEFAULT_OPTIONS } from './mashx/types'
import type { MashxResult, MashxOptions, DatabaseSource } from './mashx/types'
import './App.css'

function AnalysisPage() {
  const [queryFiles, setQueryFiles] = useState<File[]>([])
  const [dbSource, setDbSource] = useState<DatabaseSource | null>(null)
  const [options, setOptions] = useState<MashxOptions>(DEFAULT_OPTIONS)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState('')
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<MashxResult | null>(null)

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
          <ProgressBar value={progressPct} label={progress} />
        </section>
      )}

      {error && (
        <section className="error" role="alert">
          <p>{error}</p>
        </section>
      )}

      {result && <ResultsTable result={result} />}

      {logLines.length > 0 && <LogConsole logs={logLines} />}
    </>
  )
}

function App() {
  useEffect(() => {
    const saved = (localStorage.getItem('gx-theme') as 'light' | 'dark') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div className="app">
      <NavBar
        appName="MASHX"
        appSubtitle="Browser-based Mash distance tool"
        githubUrl="https://github.com/genomicx/mashx"
        icon={
          <svg className="gx-nav-logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gx-accent)" strokeWidth="2">
            {/* Waveform/sketch icon representing MinHash */}
            <polyline points="2,12 5,7 8,15 11,9 14,13 17,6 20,12 22,12" />
          </svg>
        }
      />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <AppFooter appName="MASHX" bugReportEmail="nabil@happykhan.com" bugReportUrl="https://github.com/genomicx/mashx/issues" />
    </div>
  )
}

export default App
