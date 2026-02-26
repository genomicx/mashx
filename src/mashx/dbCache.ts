import { CACHE_VERSION } from './databases'

const CACHE_NAME = CACHE_VERSION

/**
 * Download a .msh database file, caching it in the browser Cache API.
 * On subsequent calls the cached version is returned immediately.
 *
 * @param url          CORS-accessible URL to the .msh file
 * @param onProgress   Called with [0..1] download progress
 * @returns            ArrayBuffer of the .msh file contents
 */
export async function fetchDatabase(
  url: string,
  onProgress: (fraction: number) => void,
): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(url)

  if (cached) {
    onProgress(1)
    return cached.arrayBuffer()
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`)
  }

  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0

  const reader = response.body?.getReader()
  if (!reader) throw new Error('ReadableStream not supported')

  const chunks: Uint8Array[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total > 0) onProgress(received / total)
  }

  const buffer = mergeChunks(chunks, received)

  // Store in cache for future visits
  await cache.put(url, new Response(buffer.slice(0), {
    headers: { 'Content-Type': 'application/octet-stream' },
  }))

  onProgress(1)
  return buffer
}

function mergeChunks(chunks: Uint8Array[], total: number): ArrayBuffer {
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  return merged.buffer
}

/** Check if a URL is already cached */
export async function isCached(url: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME)
  const match = await cache.match(url)
  return match !== undefined
}

/** Evict a specific URL from the cache */
export async function evictDatabase(url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(url)
}

/** Evict all cached databases */
export async function clearAllCaches(): Promise<void> {
  await caches.delete(CACHE_NAME)
}
