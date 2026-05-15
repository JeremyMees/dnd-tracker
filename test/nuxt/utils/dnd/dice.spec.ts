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

      rolls.forEach((roll) => {
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
})
