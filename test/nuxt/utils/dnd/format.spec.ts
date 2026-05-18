import { describe, expect, it } from 'vitest'

describe('dnd/format', () => {
  describe('formatBonus', () => {
    it('should prefix positive numbers with +', () => {
      expect(formatBonus(1)).toBe('+1')
      expect(formatBonus(5)).toBe('+5')
    })

    it('should prefix zero with +', () => {
      expect(formatBonus(0)).toBe('+0')
    })

    it('should not add a prefix for negative numbers', () => {
      expect(formatBonus(-1)).toBe('-1')
      expect(formatBonus(-5)).toBe('-5')
    })
  })
})
