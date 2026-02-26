import type { MashHit, MashxResult, MashxOptions, DatabaseSource } from './types'
import { fetchDatabase } from './dbCache'
import { fetchMeta } from './meta'
import { MASH_SKETCH_SIZE, MASH_KMER_SIZE } from './databases'

// ── Mash WASM types ──────────────────────────────────────────────────────────

interface MashInstance {
  callMain: (args: string[]) => void
  FS: {
    mkdirTree: (path: string) => void
    writeFile: (path: string, data: Uint8Array | string) => void
    readFile: (path: string) => Uint8Array
    unlink: (path: string) => void
  }
}

interface MashRunResult {
  stdout: string
  stderr: string
}

// Cache the WASM binary so we only fetch once
let wasmBinaryCache: ArrayBuffer | null = null

async function loadWasmBinary(): Promise<ArrayBuffer> {
  if (wasmBinaryCache) return wasmBinaryCache
  const response = await fetch('/wasm/mash.wasm')
  if (!response.ok) throw new Error(`Failed to fetch mash.wasm: ${response.status}`)
  wasmBinaryCache = await response.arrayBuffer()
  return wasmBinaryCache
}

/**
 * Create a fresh Mash WASM instance.
 * Each call returns an independent module with its own filesystem.
 * This is necessary because Emscripten modules have global state
 * that doesn't reset between callMain() invocations.
 */
async function createMashInstance(): Promise<{
  instance: MashInstance
  run: (args: string[]) => MashRunResult
}> {
  const wasmBinary = await loadWasmBinary()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mashFactory = (window as any).Module

  if (!mashFactory) {
    throw new Error(
      'Mash Module not found on window. Ensure /wasm/mash.js is loaded via <script> tag.',
    )
  }

  let stdout = ''
  let stderr = ''

  const instance: MashInstance = await mashFactory({
    wasmBinary: new Uint8Array(wasmBinary),
    print: (text: string) => {
      stdout += text + '\n'
    },
    printErr: (text: string) => {
      stderr += text + '\n'
    },
    noInitialRun: true,
  })

  const run = (args: string[]): MashRunResult => {
    stdout = ''
    stderr = ''
    try {
      instance.callMain(args)
    } catch {
      // Mash may call exit() which throws in Emscripten
    }
    return { stdout: stdout.trim(), stderr: stderr.trim() }
  }

  return { instance, run }
}

function writeFileToMash(
  instance: MashInstance,
  path: string,
  data: Uint8Array,
): void {
  const dir = path.substring(0, path.lastIndexOf('/'))
  if (dir) {
    try {
      instance.FS.mkdirTree(dir)
    } catch {
      // Directory may already exist
    }
  }
  instance.FS.writeFile(path, data)
}

type ProgressCallback = (msg: string, pct: number) => void
type LogCallback = (msg: string) => void

/**
 * Run the full MashX pipeline:
 * 1. Load/download the database .msh
 * 2. Sketch query FASTA files
 * 3. Run mash dist
 * 4. Parse and annotate results
 */
export async function runMashx(
  queryFiles: File[],
  dbSource: DatabaseSource,
  options: MashxOptions,
  onProgress: ProgressCallback,
  onLog: LogCallback,
): Promise<MashxResult> {
  if (queryFiles.length === 0) throw new Error('At least one query file is required')

  const sketchSize = options.sketchSize ?? MASH_SKETCH_SIZE
  const kmerSize = options.kmerSize ?? MASH_KMER_SIZE

  // ── Step 1: Load database .msh ────────────────────────────────────────
  let dbBuffer: ArrayBuffer
  let dbName: string
  let metaUrl: string | undefined

  if (dbSource.type === 'preset') {
    const cfg = dbSource.config
    dbName = `${cfg.name} ${cfg.version}`
    metaUrl = cfg.metaUrl
    onProgress(`Fetching database: ${cfg.name}...`, 5)
    onLog(`[MashX] Fetching ${cfg.name} (${cfg.version})...`)
    dbBuffer = await fetchDatabase(cfg.url, (fraction) => {
      onProgress(
        `Downloading database... ${Math.round(fraction * 100)}%`,
        5 + fraction * 30,
      )
    })
    onLog(`[MashX] Database ready (${(dbBuffer.byteLength / 1_000_000).toFixed(1)} MB).`)
  } else {
    dbName = dbSource.file.name
    onProgress('Reading uploaded database...', 10)
    onLog(`[MashX] Reading user-supplied database: ${dbSource.file.name}`)
    dbBuffer = await dbSource.file.arrayBuffer()
    onLog(`[MashX] Database loaded (${(dbBuffer.byteLength / 1_000_000).toFixed(1)} MB).`)
  }

  // ── Step 2: Initialise Mash WASM and sketch query files ─────────────
  onProgress('Initialising Mash (WebAssembly)...', 37)
  onLog('[MashX] Loading Mash WASM...')

  const sketchMash = await createMashInstance()
  onLog('[MashX] Mash ready.')

  // Read query files and write to virtual filesystem
  onProgress('Loading query files...', 40)
  onLog('[MashX] Loading query files into WASM filesystem...')

  const queryPaths: string[] = []
  for (const file of queryFiles) {
    const data = new Uint8Array(await file.arrayBuffer())
    const path = `/data/${file.name}`
    writeFileToMash(sketchMash.instance, path, data)
    queryPaths.push(path)
    onLog(`[MashX] Loaded ${file.name} (${data.length} bytes)`)
  }

  // Sketch query sequences
  onProgress('Sketching query sequences...', 45)
  onLog(`[MashX] Sketching queries (k=${kmerSize}, s=${sketchSize})...`)

  const sketchArgs = [
    'sketch', '-o', '/data/query',
    '-k', String(kmerSize),
    '-s', String(sketchSize),
    ...queryPaths,
  ]
  onLog(`[MashX] $ mash ${sketchArgs.join(' ')}`)
  const sketchResult = sketchMash.run(sketchArgs)
  if (sketchResult.stderr) onLog(`[mash] ${sketchResult.stderr}`)

  // Read the .msh sketch from virtual FS
  let queryMsh: Uint8Array
  try {
    queryMsh = sketchMash.instance.FS.readFile('/data/query.msh')
    onLog(`[MashX] Query sketch: ${queryMsh.length} bytes`)
  } catch (err) {
    throw new Error(`Failed to read query sketch: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Step 3: Run mash dist on a FRESH instance ──────────────────────
  onProgress('Running mash dist...', 60)
  onLog('[MashX] Initialising fresh Mash WASM for dist...')

  const distMash = await createMashInstance()

  // Write both database and query sketch to the new instance
  writeFileToMash(distMash.instance, '/data/database.msh', new Uint8Array(dbBuffer))
  writeFileToMash(distMash.instance, '/data/query.msh', queryMsh)

  onLog('[MashX] Running mash dist...')
  const distArgs = ['dist', '/data/database.msh', '/data/query.msh']
  onLog(`[MashX] $ mash ${distArgs.join(' ')}`)
  const distResult = distMash.run(distArgs)
  if (distResult.stderr) onLog(`[mash] ${distResult.stderr}`)

  // ── Step 4: Parse results ─────────────────────────────────────────────
  onProgress('Parsing results...', 80)
  onLog('[MashX] Parsing output...')

  const rawHits = parseMashDist(distResult.stdout)
  onLog(`[MashX] ${rawHits.length} raw hits parsed.`)

  // ── Step 5: Fetch metadata and annotate ───────────────────────────────
  let metaMap = new Map<string, { taxName: string; taxId: string; organism: string }>()
  if (metaUrl) {
    onProgress('Fetching taxonomy metadata...', 85)
    onLog('[MashX] Fetching taxonomy metadata...')
    metaMap = await fetchMeta(metaUrl)
    onLog(`[MashX] Loaded metadata for ${metaMap.size} entries.`)
  }

  const annotated = rawHits.map((hit) => {
    const meta = lookupMeta(hit.reference, metaMap)
    return { ...hit, ...meta }
  })

  // Sort by distance ascending, take top N
  const sorted = annotated
    .sort((a, b) => a.distance - b.distance)
    .slice(0, options.topN)

  onProgress('Done!', 100)
  onLog(`[MashX] Complete. Showing top ${sorted.length} hits.`)

  return {
    hits: sorted,
    queryFiles: queryFiles.map((f) => f.name),
    databaseName: dbName,
    ranAt: new Date().toISOString(),
    topN: options.topN,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMashDist(stdout: string): MashHit[] {
  const hits: MashHit[] = []
  for (const line of stdout.trim().split('\n')) {
    if (!line.trim()) continue
    // Format: reference-id  query-id  distance  p-value  shared-hashes
    const parts = line.split('\t')
    if (parts.length < 5) continue
    const [reference, query, distStr, pStr, hashes] = parts
    const distance = parseFloat(distStr)
    const pValue = parseFloat(pStr)
    if (isNaN(distance) || isNaN(pValue)) continue
    hits.push({ reference, query, distance, pValue, sharedHashes: hashes })
  }
  return hits
}

function lookupMeta(
  reference: string,
  metaMap: Map<string, { taxName: string; taxId: string; organism: string }>,
) {
  // Try full ID first, then accession prefix
  const direct = metaMap.get(reference)
  if (direct) return direct
  const prefix = reference.split('.')[0]
  return metaMap.get(prefix) ?? {}
}
