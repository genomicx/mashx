/**
 * Fetch and parse a metadata TSV file used to annotate Mash hits.
 * Expected columns (tab-separated, first row is header):
 *   Assembly, TaxID, Name, ...  (Kalamari chromosomes.tsv format)
 *
 * Returns a Map from accession/name -> { taxName, taxId, organism }
 */
export interface MetaEntry {
  taxName: string
  taxId: string
  organism: string
}

export async function fetchMeta(url: string): Promise<Map<string, MetaEntry>> {
  const response = await fetch(url)
  if (!response.ok) {
    console.warn(`[meta] Could not fetch metadata from ${url}: ${response.status}`)
    return new Map()
  }

  const text = await response.text()
  return parseTsv(text)
}

function parseTsv(text: string): Map<string, MetaEntry> {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return new Map()

  const header = lines[0].split('\t').map((h) => h.toLowerCase().trim())
  const assemblyIdx = header.findIndex((h) => h.includes('assembly') || h.includes('accession'))
  const taxIdIdx = header.findIndex((h) => h.includes('taxid') || h.includes('tax_id'))
  const nameIdx = header.findIndex(
    (h) => h.includes('scientificname') || h.includes('organism') || h.includes('name'),
  )

  const map = new Map<string, MetaEntry>()

  for (const line of lines.slice(1)) {
    if (!line.trim() || line.startsWith('#')) continue
    const cols = line.split('\t')

    const assembly = assemblyIdx >= 0 ? cols[assemblyIdx]?.trim() ?? '' : ''
    const taxId = taxIdIdx >= 0 ? cols[taxIdIdx]?.trim() ?? '' : ''
    const organism = nameIdx >= 0 ? cols[nameIdx]?.trim() ?? '' : ''

    if (assembly) {
      map.set(assembly, { taxName: organism, taxId, organism })
      // Also index by accession prefix (e.g. "GCF_000123.1" -> "GCF_000123")
      const prefix = assembly.split('.')[0]
      if (prefix !== assembly) map.set(prefix, { taxName: organism, taxId, organism })
    }
  }

  return map
}
