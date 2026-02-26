import type { MashHit, MashxResult, MashxOptions, DatabaseSource } from './types'
import { fetchDatabase } from './dbCache'
import { fetchMeta } from './meta'
import { MASH_SKETCH_SIZE, MASH_KMER_SIZE } from './databases'

declare const Aioli: {
  new (tools: string[]): Promise<AioliInstance>
}

interface AioliInstance {
  mount: (files: File[] | { name: string; data: ArrayBuffer }[]) => Promise<string[]>
  exec: (cmd: string) => Promise<{ stdout: string; stderr: string }>
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

  // ── Step 1: Initialise Aioli ──────────────────────────────────────────
  onProgress('Initialising Mash (WebAssembly)...', 2)
  onLog('[MashX] Loading Mash via biowasm...')

  const CLI: AioliInstance = await new Aioli(['mash/2.3'])
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

  // ── Step 3: Mount files into the WASM filesystem ──────────────────────
  onProgress('Mounting files...', 37)
  onLog('[MashX] Mounting query files...')

  const mountedDb = await CLI.mount([{ name: 'database.msh', data: dbBuffer }])
  const mountedQueries = await CLI.mount(queryFiles)

  onLog(`[MashX] Mounted ${queryFiles.length} query file(s) + database.`)

  // ── Step 4: Sketch query files ────────────────────────────────────────
  onProgress('Sketching query sequences...', 42)
  onLog(`[MashX] Sketching queries (k=${kmerSize}, s=${sketchSize})...`)

  const queryPaths = mountedQueries.join(' ')
  const sketchCmd = `mash sketch -k ${kmerSize} -s ${sketchSize} -o /tmp/query ${queryPaths}`
  onLog(`[MashX] $ ${sketchCmd}`)
  const sketchResult = await CLI.exec(sketchCmd)
  if (sketchResult.stderr) onLog(`[mash] ${sketchResult.stderr.trim()}`)

  // ── Step 5: Run mash dist ─────────────────────────────────────────────
  onProgress('Running mash dist...', 60)
  onLog('[MashX] Running mash dist...')

  const distCmd = `mash dist ${mountedDb[0]} /tmp/query.msh`
  onLog(`[MashX] $ ${distCmd}`)
  const distResult = await CLI.exec(distCmd)
  if (distResult.stderr) onLog(`[mash] ${distResult.stderr.trim()}`)

  // ── Step 6: Parse results ─────────────────────────────────────────────
  onProgress('Parsing results...', 80)
  onLog('[MashX] Parsing output...')

  const rawHits = parseMashDist(distResult.stdout)
  onLog(`[MashX] ${rawHits.length} raw hits parsed.`)

  // ── Step 7: Fetch metadata and annotate ───────────────────────────────
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
