import { describe, expect, it } from 'vitest'

describe('dnd/dice', () => {
  describe('randomRoll', () => {
    it('should return a number between 1 and max', () => {
      const max = 20
      const roll = randomRoll(max)

      expect(roll).toBeGreaterThanOrEqual(1)
      expect(roll).toBeLessThanOrEqual(max)
    })
  })

  describe('rollDice', () => {
    it('should return array of rolls with correct length and range', () => {
      const dice = 20
      const amount = 3
      const rolls = rollDice(dice, amount)

      expect(rolls).toHaveLength(amount)

      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(dice)
      })
    })
  })

  describe('validateDiceExpression', () => {
    it('should return true for valid dice expressions', () => {
      expect(validateDiceExpression('1d4')).toBeTruthy()
      expect(validateDiceExpression('2d6')).toBeTruthy()
      expect(validateDiceExpression('3d8')).toBeTruthy()
      expect(validateDiceExpression('1d10')).toBeTruthy()
      expect(validateDiceExpression('2d12')).toBeTruthy()
      expect(validateDiceExpression('1d20')).toBeTruthy()
      expect(validateDiceExpression('1d100')).toBeTruthy()
      expect(validateDiceExpression('100d20')).toBeTruthy()
    })

    it('should return false for invalid dice expressions', () => {
      expect(validateDiceExpression('1d3')).toBeFalsy()
      expect(validateDiceExpression('1d5')).toBeFalsy()
      expect(validateDiceExpression('1d7')).toBeFalsy()
      expect(validateDiceExpression('1d15')).toBeFalsy()
      expect(validateDiceExpression('0d20')).toBeFalsy()
      expect(validateDiceExpression('101d20')).toBeFalsy()
      expect(validateDiceExpression('1d')).toBeFalsy()
      expect(validateDiceExpression('d20')).toBeFalsy()
      expect(validateDiceExpression('1d20+5')).toBeFalsy()
      expect(validateDiceExpression('abc')).toBeFalsy()
      expect(validateDiceExpression('')).toBeFalsy()
    })
  })

  describe('parseDamageDice', () => {
    it('should parse single dice expressions correctly', () => {
      expect(parseDamageDice('1d4')).toEqual([{ count: 1, sides: 4 }])
      expect(parseDamageDice('2d6')).toEqual([{ count: 2, sides: 6 }])
      expect(parseDamageDice('3d8')).toEqual([{ count: 3, sides: 8 }])
      expect(parseDamageDice('1d20')).toEqual([{ count: 1, sides: 20 }])
    })

    it('should parse multiple expressions with plus and spaces', () => {
      expect(parseDamageDice('1d4+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('2d6 + 1d8 + 1d4')).toEqual([
        { count: 2, sides: 6 },
        { count: 1, sides: 8 },
        { count: 1, sides: 4 },
      ])
    })

    it('should filter invalid expressions', () => {
      expect(parseDamageDice('1d4+1d3+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('1d3+1d5+abc')).toEqual([])
    })

    it('should return empty array for empty input', () => {
      expect(parseDamageDice()).toEqual([])
      expect(parseDamageDice('')).toEqual([])
      expect(parseDamageDice('   ')).toEqual([])
    })
  })

  describe('formatAttackDice', () => {
    it('should format count and type into a dice string', () => {
      expect(formatAttackDice(2, 'd6')).toBe('2d6')
      expect(formatAttackDice(1, 'd20')).toBe('1d20')
    })

    it('should return undefined when count is missing', () => {
      expect(formatAttackDice(undefined, 'd6')).toBeUndefined()
      expect(formatAttackDice(0, 'd6')).toBeUndefined()
    })

    it('should return undefined when type is missing', () => {
      expect(formatAttackDice(2, undefined)).toBeUndefined()
    })
  })

  describe('parseAttackDice', () => {
    it('should parse a valid dice expression', () => {
      expect(parseAttackDice('2d6')).toEqual({
        damageDieCount: 2,
        damageDieType: 'd6',
      })
    })

    it('should lowercase the dice type', () => {
      expect(parseAttackDice('1D20')).toEqual({
        damageDieCount: 1,
        damageDieType: 'd20',
      })
    })

    it('should return undefined for an invalid expression', () => {
      expect(parseAttackDice('2d3')).toBeUndefined()
      expect(parseAttackDice('abc')).toBeUndefined()
    })

    it('should return undefined for null or undefined input', () => {
      expect(parseAttackDice(null)).toBeUndefined()
      expect(parseAttackDice(undefined)).toBeUndefined()
    })
  })

  describe('parseHitDice', () => {
    it('should parse hit dice expression including bonus', () => {
      expect(parseHitDice('12d10+36')).toEqual({
        hitDiceCount: 12,
        hitDiceType: 'd10',
        hitDiceBonus: 36,
      })
    })

    it('should parse hit dice expression without bonus', () => {
      expect(parseHitDice('4d8')).toEqual({
        hitDiceCount: 4,
        hitDiceType: 'd8',
      })
    })

    it('should fallback for invalid expression', () => {
      expect(parseHitDice('unknown')).toEqual({
        hitDiceCount: 1,
        hitDiceType: 'd4',
      })
    })
  })

  describe('parseDndDiceToString', () => {
    it('should convert hit dice object to string with bonus', () => {
      const hitDice = {
        hitDiceCount: 12,
        hitDiceType: 'd10' as const,
        hitDiceBonus: 36,
      }

      expect(parseDndDiceToString(hitDice)).toBe('12d10+36')
    })

    it('should convert hit dice object to string without bonus', () => {
      const hitDice = {
        hitDiceCount: 4,
        hitDiceType: 'd8' as const,
      }

      expect(parseDndDiceToString(hitDice)).toBe('4d8')
    })

    it('should handle zero bonus correctly', () => {
      const hitDiceWithZeroBonus = {
        hitDiceCount: 3,
        hitDiceType: 'd6' as const,
        hitDiceBonus: 0,
      }

      expect(parseDndDiceToString(hitDiceWithZeroBonus)).toBe('3d6')
    })

    it('should handle negative bonus correctly', () => {
      const hitDiceWithNegativeBonus = {
        hitDiceCount: 5,
        hitDiceType: 'd12' as const,
        hitDiceBonus: -10,
      }

      expect(parseDndDiceToString(hitDiceWithNegativeBonus)).toBe('5d12-10')
    })
  })
})
