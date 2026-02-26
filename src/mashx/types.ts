import type { DatabaseConfig } from './databases'

/** A single Mash distance result row */
export interface MashHit {
  reference: string       // reference sequence ID from .msh
  query: string           // query file name
  distance: number        // Mash distance [0, 1]
  pValue: number          // p-value
  sharedHashes: string    // e.g. "950/1000"
  // Populated if metadata TSV is available
  taxName?: string
  taxId?: string
  organism?: string
}

/** State of a database — not loaded, downloading, cached, or error */
export type DatabaseStatus =
  | { state: 'idle' }
  | { state: 'downloading'; progress: number }
  | { state: 'ready'; bytes: number }
  | { state: 'error'; message: string }

/** The active database source — either a preset or a user-supplied file */
export type DatabaseSource =
  | { type: 'preset'; config: DatabaseConfig }
  | { type: 'upload'; file: File }

/** Overall pipeline result */
export interface MashxResult {
  hits: MashHit[]
  queryFiles: string[]
  databaseName: string
  ranAt: string           // ISO timestamp
  topN: number
}

/** Options passed to the pipeline */
export interface MashxOptions {
  topN: number
  sketchSize: number
  kmerSize: number
}

export const DEFAULT_OPTIONS: MashxOptions = {
  topN: 20,
  sketchSize: 1000,
  kmerSize: 21,
}
