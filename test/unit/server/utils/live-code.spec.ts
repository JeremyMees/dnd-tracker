import { describe, expect, it } from 'vitest'
import { generateLiveCode } from '~~/server/utils/live-code'

describe('generateLiveCode', () => {
  it('generates a 6-character code', () => {
    expect(generateLiveCode()).toHaveLength(6)
  })

  it('only uses unambiguous uppercase letters and digits', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateLiveCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('generates different codes across calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateLiveCode()))

    expect(codes.size).toBeGreaterThan(1)
  })
})
