import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMeta } from './meta'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchMeta', () => {
  it('parses a TSV with assembly, taxid, and name columns', async () => {
    const tsv = [
      'Assembly\tTaxID\tScientificName',
      'GCF_000123.1\t562\tEscherichia coli',
      'GCF_000456.2\t1280\tStaphylococcus aureus',
    ].join('\n')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(tsv, { status: 200 }),
    )

    const map = await fetchMeta('https://example.com/meta.tsv')

    // Full ID lookup
    expect(map.get('GCF_000123.1')).toEqual({
      taxName: 'Escherichia coli',
      taxId: '562',
      organism: 'Escherichia coli',
    })

    // Prefix lookup
    expect(map.get('GCF_000123')).toEqual({
      taxName: 'Escherichia coli',
      taxId: '562',
      organism: 'Escherichia coli',
    })

    // Second entry
    expect(map.get('GCF_000456.2')?.organism).toBe('Staphylococcus aureus')
  })

  it('handles alternative column names (accession, organism)', async () => {
    const tsv = [
      'accession\ttax_id\torganism',
      'NC_001.1\t99\tSome organism',
    ].join('\n')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(tsv, { status: 200 }),
    )

    const map = await fetchMeta('https://example.com/alt.tsv')
    expect(map.get('NC_001.1')?.taxId).toBe('99')
    expect(map.get('NC_001.1')?.organism).toBe('Some organism')
  })

  it('returns empty map on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 404 }),
    )
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const map = await fetchMeta('https://example.com/missing.tsv')
    expect(map.size).toBe(0)
  })

  it('skips comment and empty lines', async () => {
    const tsv = [
      'Assembly\tTaxID\tName',
      '# This is a comment',
      '',
      'GCF_001.1\t100\tFoo',
    ].join('\n')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(tsv, { status: 200 }),
    )

    const map = await fetchMeta('https://example.com/meta.tsv')
    expect(map.size).toBe(2) // GCF_001.1 + prefix GCF_001
    expect(map.get('GCF_001.1')?.organism).toBe('Foo')
  })

  it('returns empty map for single-line TSV (header only)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Assembly\tTaxID\tName', { status: 200 }),
    )

    const map = await fetchMeta('https://example.com/empty.tsv')
    expect(map.size).toBe(0)
  })
})
