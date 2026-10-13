import { describe, expect, it } from 'vitest'

describe('checks', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBeTruthy()
      expect(isDefined('')).toBeTruthy()
      expect(isDefined(false)).toBeTruthy()
      expect(isDefined({})).toBeTruthy()
    })

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBeFalsy()
      expect(isDefined(undefined)).toBeFalsy()
    })
  })
})
