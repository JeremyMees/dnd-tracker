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
})
