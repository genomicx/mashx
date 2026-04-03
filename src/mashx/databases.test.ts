import { describe, it, expect } from 'vitest'
import {
  DATABASES,
  CACHE_VERSION,
  DEFAULT_TOP_N,
  MASH_SKETCH_SIZE,
  MASH_KMER_SIZE,
} from './databases'

describe('databases', () => {
  it('exports expected constants', () => {
    expect(CACHE_VERSION).toBe('mashx-v1')
    expect(DEFAULT_TOP_N).toBe(20)
    expect(MASH_SKETCH_SIZE).toBe(1000)
    expect(MASH_KMER_SIZE).toBe(21)
  })

  it('DATABASES is a non-empty array', () => {
    expect(Array.isArray(DATABASES)).toBe(true)
    expect(DATABASES.length).toBeGreaterThan(0)
  })

  it.each(DATABASES)('database "$name" has required fields', (db) => {
    expect(db.id).toBeTruthy()
    expect(db.name).toBeTruthy()
    expect(db.description).toBeTruthy()
    expect(db.url).toMatch(/^https?:\/\//)
    expect(db.sizeBytes).toBeGreaterThan(0)
    expect(db.version).toBeTruthy()
  })

  it('database IDs are unique', () => {
    const ids = DATABASES.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
