import { describe, it, expect } from 'vitest'
import { DEFAULT_OPTIONS } from './types'

describe('DEFAULT_OPTIONS', () => {
  it('has correct default values', () => {
    expect(DEFAULT_OPTIONS).toEqual({
      topN: 20,
      sketchSize: 1000,
      kmerSize: 21,
    })
  })
})
