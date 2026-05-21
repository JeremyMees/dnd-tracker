import { describe, expect, it } from 'vitest'

describe('dnd/format', () => {
  describe('formatRange', () => {
    const base: DndAttack = { name: 'Strike', attackType: 'melee', distanceUnit: 'feet' }

    it('Should return reach in feet', () => {
      expect(formatRange({ ...base, reach: 5 })).toBe('5 ft')
    })

    it('Should return reach in miles', () => {
      expect(formatRange({ ...base, distanceUnit: 'miles', reach: 1 })).toBe('1 mi')
    })

    it('Should return range without long range', () => {
      expect(formatRange({ ...base, range: 80 })).toBe('80 ft')
    })

    it('Should return range/longRange when both are set', () => {
      expect(formatRange({ ...base, range: 80, longRange: 320 })).toBe('80/320 ft')
    })

    it('Should prioritise reach over range when both are present', () => {
      expect(formatRange({ ...base, reach: 5, range: 30 })).toBe('5 ft')
    })

    it('Should return null when neither reach nor range is set', () => {
      expect(formatRange(base)).toBeNull()
    })
  })

  describe('formatUsageLimits', () => {
    it('Should format perDay with param', () => {
      expect(formatUsageLimits({ type: 'perDay', param: 3 })).toBe('3/day')
    })

    it('Should format recharge with param as lower bound', () => {
      expect(formatUsageLimits({ type: 'recharge', param: 5 })).toBe('Recharge 5-6')
      expect(formatUsageLimits({ type: 'recharge', param: 3 })).toBe('Recharge 3-6')
    })

    it('Should format atWill as "At will" regardless of param', () => {
      expect(formatUsageLimits({ type: 'atWill', param: 1 })).toBe('At will')
    })

    it('Should format perRest with param', () => {
      expect(formatUsageLimits({ type: 'perRest', param: 2 })).toBe('2/rest')
    })
  })

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
