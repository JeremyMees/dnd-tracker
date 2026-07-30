import { describe, expect, it } from 'vitest'

describe('dnd/abilities', () => {
  describe('modifierFromScore', () => {
    it('should return correct DnD modifiers', () => {
      expect(modifierFromScore(1)).toBe(-5)
      expect(modifierFromScore(8)).toBe(-1)
      expect(modifierFromScore(10)).toBe(0)
      expect(modifierFromScore(12)).toBe(1)
      expect(modifierFromScore(20)).toBe(5)
    })

    it('should never return lower than -5 DnD modifiers', () => {
      expect(modifierFromScore(0)).toBe(-5)
      expect(modifierFromScore(-10)).toBe(-5)
      expect(modifierFromScore(-20)).toBe(-5)
    })

    it('should never return higher than 5 DnD modifiers', () => {
      expect(modifierFromScore(21)).toBe(5)
      expect(modifierFromScore(30)).toBe(5)
      expect(modifierFromScore(100)).toBe(5)
    })
  })
})
