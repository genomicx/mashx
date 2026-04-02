/**
 * mashx database configuration
 *
 * To add a new database, append an entry to the DATABASES array.
 * Fields:
 *   id         — unique slug, used for Cache API key
 *   name       — display name shown in the UI
 *   description — short description shown in the selector
 *   url        — direct URL to the .msh file (must be CORS-accessible)
 *   metaUrl    — optional URL to a TSV with columns: name, taxid (or similar)
 *                used to annotate results with taxonomy info
 *   sizeBytes  — approximate size for progress UX (can be rough estimate)
 *   version    — version string shown in UI (e.g. "v5.8.3")
 *   citation   — citation string shown on About page
 */

export interface DatabaseConfig {
  id: string
  name: string
  description: string
  url: string
  metaUrl?: string
  sizeBytes: number
  version: string
  citation?: string
}

export const DATABASES: DatabaseConfig[] = [
  {
    id: 'kalamari-v5.8.3',
    name: 'Kalamari',
    description: 'Curated complete assemblies for public health pathogens',
    url: 'https://static.genomicx.org/db/kalamari-v5.8.3.msh',
    metaUrl: 'https://raw.githubusercontent.com/lskatz/Kalamari/master/src/chromosomes.tsv',
    sizeBytes: 78_700_000,
    version: 'v5.8.3',
    citation:
      'Katz LS et al. 2025. "Kalamari: a representative set of genomes of public health concern." Microbiol Resour Announc 14:e00963-24.',
  },
  // Add more databases here, for example:
  // {
  //   id: 'refseq-bacteria-2024',
  //   name: 'RefSeq Bacteria (2024)',
  //   description: 'Mash sketch of NCBI RefSeq complete bacterial genomes',
  //   url: 'https://YOUR_CDN_URL/refseq-bacteria-2024.msh',
  //   sizeBytes: 120_000_000,
  //   version: '2024-01',
  // },
]

/** Cache version — bump this to invalidate all cached databases */
export const CACHE_VERSION = 'mashx-v1'

/** Default top-N results to display */
export const DEFAULT_TOP_N = 20

/** Mash sketch parameters */
export const MASH_SKETCH_SIZE = 1000
export const MASH_KMER_SIZE = 21
