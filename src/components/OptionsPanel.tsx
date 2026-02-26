import type { MashxOptions } from '../mashx/types'

interface OptionsPanelProps {
  options: MashxOptions
  onChange: (opts: MashxOptions) => void
  disabled: boolean
}

export function OptionsPanel({ options, onChange, disabled }: OptionsPanelProps) {
  function update(patch: Partial<MashxOptions>) {
    onChange({ ...options, ...patch })
  }

  return (
    <div className="options-panel">
      <h3 className="options-title">Options</h3>
      <div className="options-grid">
        <label className="option-field">
          <span className="option-label">Top N hits</span>
          <input
            type="number"
            min={1}
            max={500}
            value={options.topN}
            onChange={(e) => update({ topN: parseInt(e.target.value, 10) || 20 })}
            disabled={disabled}
            className="option-input"
          />
        </label>
        <label className="option-field">
          <span className="option-label">Sketch size (s)</span>
          <input
            type="number"
            min={100}
            max={100000}
            step={100}
            value={options.sketchSize}
            onChange={(e) => update({ sketchSize: parseInt(e.target.value, 10) || 1000 })}
            disabled={disabled}
            className="option-input"
          />
        </label>
        <label className="option-field">
          <span className="option-label">k-mer size (k)</span>
          <input
            type="number"
            min={7}
            max={32}
            value={options.kmerSize}
            onChange={(e) => update({ kmerSize: parseInt(e.target.value, 10) || 21 })}
            disabled={disabled}
            className="option-input"
          />
        </label>
      </div>
    </div>
  )
}
