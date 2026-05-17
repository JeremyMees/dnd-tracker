import { describe, expect, it } from 'vitest'
import { sheet } from '~~/test/nuxt/fixtures/initiative-sheet'

describe('dnd/checks', () => {
  describe('hasMaxCharacters', () => {
    it('should return true when sheet has 50 rows', () => {
      const fullSheet = {
        ...sheet,
        rows: Array(50).fill(sheet.rows[0]),
      }

      expect(hasMaxCharacters(fullSheet)).toBeTruthy()
    })

    it('should return false when sheet has less than 50 rows', () => {
      expect(hasMaxCharacters(sheet)).toBeFalsy()
    })

    it('should return false when sheet is undefined', () => {
      expect(hasMaxCharacters(undefined)).toBeFalsy()
    })
  })

  describe('concentrationDC', () => {
    it('should return 10 for zero damage', () => {
      expect(concentrationDC(0)).toBe(10)
    })

    it('should return 10 when half damage is below 10', () => {
      expect(concentrationDC(1)).toBe(10)
      expect(concentrationDC(10)).toBe(10)
      expect(concentrationDC(19)).toBe(10)
    })

    it('should return half damage (floored) when it exceeds 10', () => {
      expect(concentrationDC(22)).toBe(11)
      expect(concentrationDC(40)).toBe(20)
      expect(concentrationDC(50)).toBe(25)
    })

    it('should floor half damage for odd numbers', () => {
      expect(concentrationDC(21)).toBe(10)
      expect(concentrationDC(23)).toBe(11)
    })

    it('should return 10 for negative damage', () => {
      expect(concentrationDC(-10)).toBe(10)
    })

    it('should cap at 30', () => {
      expect(concentrationDC(60)).toBe(30)
      expect(concentrationDC(100)).toBe(30)
    })
  })
})
