import type { MashHit, MashxResult, MashxOptions, DatabaseSource } from './types'
import { fetchDatabase } from './dbCache'
import { fetchMeta } from './meta'
import { MASH_SKETCH_SIZE, MASH_KMER_SIZE } from './databases'

const WASM_BASE = 'https://static.genomicx.org/wasm'

// Cached module factory and WASM binary
let mashFactory: ((opts: object) => Promise<any>) | null = null
let mashWasmBinary: ArrayBuffer | null = null

async function loadMashFactory() {
  if (mashFactory && mashWasmBinary) return

  const [jsRes, wasmRes] = await Promise.all([
    fetch(`${WASM_BASE}/mash.js`),
    fetch(`${WASM_BASE}/mash.wasm`),
  ])
  if (!jsRes.ok) throw new Error(`Failed to fetch mash.js: ${jsRes.status}`)
  if (!wasmRes.ok) throw new Error(`Failed to fetch mash.wasm: ${wasmRes.status}`)

  const [moduleText, wasmBinary] = await Promise.all([
    jsRes.text(),
    wasmRes.arrayBuffer(),
  ])

  const wrapper = new Function('Module', moduleText + '; return Module;')
  mashFactory = wrapper({})
  mashWasmBinary = wasmBinary
}

async function createMashInstance(): Promise<any> {
  const stdout: string[] = []
  const stderr: string[] = []
  const mod = await mashFactory!({
    wasmBinary: mashWasmBinary!.slice(0),
    print: (text: string) => { stdout.push(text) },
    printErr: (text: string) => { stderr.push(text) },
    noInitialRun: true,
  })
  mod._stdout = stdout
  mod._stderr = stderr
  return mod
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

  // ── Step 1: Load Mash WASM ────────────────────────────────────────────
  onProgress('Loading Mash (WebAssembly)...', 2)
  onLog('[MashX] Fetching Mash WASM from static.genomicx.org...')
  await loadMashFactory()
  onLog('[MashX] Mash ready.')

  // ── Step 2: Load database .msh ────────────────────────────────────────
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

  // ── Step 3: Sketch query files ────────────────────────────────────────
  onProgress('Sketching query sequences...', 37)
  onLog(`[MashX] Sketching queries (k=${kmerSize}, s=${sketchSize})...`)

  const sketchMod = await createMashInstance()

  // Write all query files into the sketch instance FS
  const queryFastaPaths: string[] = []
  for (const file of queryFiles) {
    const buf = await file.arrayBuffer()
    sketchMod.FS.writeFile(`/${file.name}`, new Uint8Array(buf))
    queryFastaPaths.push(`/${file.name}`)
  }

  const sketchArgs = ['sketch', '-k', String(kmerSize), '-s', String(sketchSize), '-o', '/tmp/query', ...queryFastaPaths]
  onLog(`[MashX] $ mash ${sketchArgs.join(' ')}`)
  try {
    sketchMod.callMain(sketchArgs)
  } catch {
    // mash sketch calls exit() which throws in Emscripten
  }

  if (sketchMod._stderr.join('').includes('ERROR')) {
    throw new Error(`mash sketch failed: ${sketchMod._stderr.join('\n')}`)
  }

  // Extract the sketch output for the dist instance
  const queryMsh = sketchMod.FS.readFile('/tmp/query.msh') as Uint8Array
  onLog(`[MashX] Sketch complete (${(queryMsh.byteLength / 1024).toFixed(0)} KB).`)

  // ── Step 4: Run mash dist ─────────────────────────────────────────────
  onProgress('Running mash dist...', 60)
  onLog('[MashX] Running mash dist...')

  const distMod = await createMashInstance()
  distMod.FS.writeFile('/database.msh', new Uint8Array(dbBuffer))
  distMod.FS.writeFile('/query.msh', queryMsh)

  const distArgs = ['dist', '/database.msh', '/query.msh']
  onLog(`[MashX] $ mash ${distArgs.join(' ')}`)
  try {
    distMod.callMain(distArgs)
  } catch {
    // mash dist calls exit() which throws
  }

  if (distMod._stderr.join('').includes('ERROR')) {
    throw new Error(`mash dist failed: ${distMod._stderr.join('\n')}`)
  }

  // ── Step 5: Parse results ─────────────────────────────────────────────
  onProgress('Parsing results...', 80)
  onLog('[MashX] Parsing output...')

  const rawHits = parseMashDist(distMod._stdout.join('\n'))
  onLog(`[MashX] ${rawHits.length} raw hits parsed.`)

  // ── Step 6: Fetch metadata and annotate ───────────────────────────────
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
  const direct = metaMap.get(reference)
  if (direct) return direct
  const prefix = reference.split('.')[0]
  return metaMap.get(prefix) ?? {}
}
