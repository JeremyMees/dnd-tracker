import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  randomName,
  randomRoll,
  rollDice,
  hpFunctions,
  acFunctions,
  deathSavesFunctions,
  indexCorrect,
  getCurrentRowIndex,
  getHP,
  getAC,
  createInitiativeRow,
  hasMaxCharacters,
  validateDiceExpression,
  parseDamageDice,
  handleHpChanges,
} from '~/utils/dnd-helpers'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

describe('DnD Helpers', () => {
  describe('randomName', () => {
    afterEach(() => vi.restoreAllMocks())

    it('Should randomName generate a name with first and last name', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const name = randomName()

      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('Should randomName include a middle name when probability is met', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05)

      const name = randomName()

      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/)
    })
  })

  describe('randomRoll', () => {
    it('Should randomRoll return a number between 1 and max', () => {
      const max = 20
      const roll = randomRoll(max)

      expect(roll).toBeGreaterThanOrEqual(1)
      expect(roll).toBeLessThanOrEqual(max)
    })
  })

  describe('rollDice', () => {
    it('Should rollDice return array of rolls with correct length and range', () => {
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
    it('Should return true for valid dice expressions', () => {
      expect(validateDiceExpression('1d4')).toBe(true)
      expect(validateDiceExpression('2d6')).toBe(true)
      expect(validateDiceExpression('3d8')).toBe(true)
      expect(validateDiceExpression('1d10')).toBe(true)
      expect(validateDiceExpression('2d12')).toBe(true)
      expect(validateDiceExpression('1d20')).toBe(true)
      expect(validateDiceExpression('1d100')).toBe(true)
      expect(validateDiceExpression('100d20')).toBe(true)
    })

    it('Should return false for invalid dice expressions', () => {
      expect(validateDiceExpression('1d3')).toBe(false) // Invalid dice sides
      expect(validateDiceExpression('1d5')).toBe(false) // Invalid dice sides
      expect(validateDiceExpression('1d7')).toBe(false) // Invalid dice sides
      expect(validateDiceExpression('1d15')).toBe(false) // Invalid dice sides
      expect(validateDiceExpression('0d20')).toBe(false) // Zero dice count
      expect(validateDiceExpression('101d20')).toBe(false) // Too many dice
      expect(validateDiceExpression('1d')).toBe(false) // Missing sides
      expect(validateDiceExpression('d20')).toBe(false) // Missing count
      expect(validateDiceExpression('1d20+5')).toBe(false) // Invalid format
      expect(validateDiceExpression('abc')).toBe(false) // Non-numeric
      expect(validateDiceExpression('')).toBe(false) // Empty string
    })
  })

  describe('parseDamageDice', () => {
    it('Should parse single dice expressions correctly', () => {
      expect(parseDamageDice('1d4')).toEqual([{ count: 1, sides: 4 }])
      expect(parseDamageDice('2d6')).toEqual([{ count: 2, sides: 6 }])
      expect(parseDamageDice('3d8')).toEqual([{ count: 3, sides: 8 }])
      expect(parseDamageDice('1d20')).toEqual([{ count: 1, sides: 20 }])
    })

    it('Should parse multiple dice expressions with plus signs', () => {
      expect(parseDamageDice('1d4+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('2d6+1d8+1d4')).toEqual([
        { count: 2, sides: 6 },
        { count: 1, sides: 8 },
        { count: 1, sides: 4 },
      ])
    })

    it('Should parse dice expressions with spaces', () => {
      expect(parseDamageDice('1d4 + 1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('2d6 + 1d8 + 1d4')).toEqual([
        { count: 2, sides: 6 },
        { count: 1, sides: 8 },
        { count: 1, sides: 4 },
      ])
    })

    it('Should filter out invalid dice expressions', () => {
      expect(parseDamageDice('1d4+1d3+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('1d4+abc+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
      expect(parseDamageDice('1d4+1d5+1d6')).toEqual([
        { count: 1, sides: 4 },
        { count: 1, sides: 6 },
      ])
    })

    it('Should return empty array for undefined or empty input', () => {
      expect(parseDamageDice()).toEqual([])
      expect(parseDamageDice('')).toEqual([])
      expect(parseDamageDice('   ')).toEqual([])
    })

    it('Should return empty array when all expressions are invalid', () => {
      expect(parseDamageDice('1d3+1d5+abc')).toEqual([])
      expect(parseDamageDice('invalid+expressions')).toEqual([])
    })

    it('Should handle complex mixed expressions', () => {
      expect(parseDamageDice('2d6+1d8+1d4+1d3')).toEqual([
        { count: 2, sides: 6 },
        { count: 1, sides: 8 },
        { count: 1, sides: 4 },
      ])
      expect(parseDamageDice('1d20 + 2d6 + 1d8 + invalid + 1d4')).toEqual([
        { count: 1, sides: 20 },
        { count: 2, sides: 6 },
        { count: 1, sides: 8 },
        { count: 1, sides: 4 },
      ])
    })
  })

  describe('handleHpChanges', () => {
    const mockRow: InitiativeSheetRow = sheet.rows[0]!

    beforeEach(() => {
      // Reset to original fixture values
      mockRow.health = 10
      mockRow.maxHealth = 100
      mockRow.tempHealth = 5
      mockRow.maxHealthOld = 10
      mockRow.concentration = true
      mockRow.conditions = [
        {
          desc: '* A paralyzed creature is incapacitated (see the condition) and can\'t move or speak.\n* The creature automatically fails Strength and Dexterity saving throws.\n* Attack rolls against the creature have advantage.\n* Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.',
          name: 'Paralyzed',
        },
      ]
      mockRow.deathSaves = {
        fail: [true, false, false],
        save: [true, false, false],
      }
    })

    it('Should heal health correctly', () => {
      const result = handleHpChanges(10, 'heal', mockRow, false)

      expect(result.row.health).toBe(20) // 10 + 10 = 20
      expect(result.toasts).toHaveLength(0)
    })

    it('Should damage health correctly', () => {
      const row = { ...mockRow, concentration: false }
      const result = handleHpChanges(5, 'damage', row, false)

      expect(result.row.health).toBe(10) // Temp health (5) absorbs the damage, regular health unchanged
      expect(result.row.tempHealth).toBe(0) // 5 - 5 = 0
      expect(result.toasts.length).toBe(0)
    })

    it('Should set temp health correctly', () => {
      const result = handleHpChanges(8, 'temp', mockRow, false)

      expect(result.row.tempHealth).toBe(8)
      expect(result.toasts).toHaveLength(0)
    })

    it('Should override health correctly', () => {
      const result = handleHpChanges(15, 'override', mockRow, false)

      expect(result.row.health).toBe(15)
      expect(result.row.maxHealth).toBe(15)
      expect(result.row.maxHealthOld).toBe(100) // Original maxHealth from fixture
      expect(result.toasts).toHaveLength(0)
    })

    it('Should not add death saves when health goes from positive to 0', () => {
      const row = { ...mockRow, health: 5 }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.health).toBe(0)
      expect(result.row.deathSaves?.fail).toEqual([true, false, false]) // Should keep original death saves
    })

    it('Should add death saves when health is 0 and gets damage', () => {
      const row = { ...mockRow, health: 0 }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.health).toBe(0) // Clamped to 0 when allowNegative is false
      expect(result.row.deathSaves?.fail).toEqual([true, true, true]) // Should add 2 more failures
    })

    it('Should remove concentration and conditions when health reaches 0', () => {
      const row = {
        ...mockRow,
        health: 5,
        concentration: true,
        conditions: [{ name: 'blinded', desc: 'Cannot see' }],
      }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.health).toBe(0)
      expect(result.row.concentration).toBe(false)
      expect(result.row.conditions).toHaveLength(0)
      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.downed.title', { name: 'Sister Iarnă' }])
    })

    it('Should show concentration toast when taking damage with concentration', () => {
      const row = { ...mockRow, health: 20, concentration: true, tempHealth: 0 }
      const result = handleHpChanges(5, 'damage', row, false)

      expect(result.row.health).toBe(15) // 20 - 5 = 15 (no temp health to absorb)
      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.concentration.title'])
      expect(result.toasts[0]?.variant).toBe('info')
    })

    it('Should show downed toast when health reaches 0', () => {
      const row = { ...mockRow, health: 5, tempHealth: 0 }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.health).toBe(0)
      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.downed.title', { name: 'Sister Iarnă' }])
      expect(result.toasts[0]?.variant).toBe('info')
    })

    it('Should show died toast when health goes too negative', () => {
      const row = { ...mockRow, health: 10, maxHealth: 20, tempHealth: 0 }
      const result = handleHpChanges(50, 'damage', row, false)

      expect(result.row.health).toBe(0) // Should be clamped to 0 when allowNegative is false
      expect(result.toasts).toHaveLength(2) // Both downed and died toasts
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.downed.title', { name: 'Sister Iarnă' }])
      expect(result.toasts[1]?.title).toEqual(['components.initiativeTable.died.title', { name: 'Sister Iarnă' }])
    })

    it('Should show stable toast when death saves are successful', () => {
      const row = {
        ...mockRow,
        health: 0,
        deathSaves: {
          save: [true, true, true],
          fail: [false, false, false],
        },
      } as InitiativeSheetRow
      const result = handleHpChanges(10, 'temp', row, false)

      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.stable.title', { name: 'Sister Iarnă' }])
    })

    it('Should set health to 0 when negative values are not allowed', () => {
      const row = { ...mockRow, health: 10, tempHealth: 0 }
      const result = handleHpChanges(15, 'damage', row, false)

      expect(result.row.health).toBe(0)
    })

    it('Should allow negative health when negative values are allowed', () => {
      const row = { ...mockRow, health: 10, tempHealth: 0 }
      const result = handleHpChanges(15, 'damage', row, true)

      expect(result.row.health).toBe(-5)
    })

    it('Should reset death saves when healing from 0 health', () => {
      const row = {
        ...mockRow,
        health: 0,
        deathSaves: {
          save: [true, true, false],
          fail: [true, false, false],
        },
      } as InitiativeSheetRow
      const result = handleHpChanges(10, 'heal', row, false)

      expect(result.row.health).toBe(10)
      expect(result.row.deathSaves).toEqual({
        fail: [false, false, false],
        save: [false, false, false],
      })
    })

    it('Should not reset death saves for summon and lair types', () => {
      const row = {
        ...mockRow,
        health: 0,
        type: 'summon',
        deathSaves: {
          save: [true, true, false],
          fail: [true, false, false],
        },
      } as InitiativeSheetRow
      const result = handleHpChanges(10, 'heal', row, false)

      expect(result.row.health).toBe(10)
      expect(result.row.deathSaves).toEqual({
        save: [true, true, false],
        fail: [true, false, false],
      })
    })

    it('Should handle override-reset type correctly', () => {
      const row = {
        ...mockRow,
        health: 15,
        maxHealth: 20,
        maxHealthOld: 25,
      }
      const result = handleHpChanges(30, 'override-reset', row, false)

      expect(result.row.health).toBe(20)
      expect(result.row.maxHealth).toBe(30)
      expect(result.row.maxHealthOld).toBeUndefined()
    })

    it('Should handle temp health damage correctly', () => {
      const row = { ...mockRow, health: 10, tempHealth: 5 }
      const result = handleHpChanges(3, 'damage', row, false)

      expect(result.row.tempHealth).toBe(2) // 5 - 3 = 2
      expect(result.row.health).toBe(10) // Should not be affected
    })

    it('Should handle damage that exceeds temp health', () => {
      const row = { ...mockRow, health: 10, tempHealth: 3 }
      const result = handleHpChanges(8, 'damage', row, false)

      expect(result.row.tempHealth).toBe(0) // Should be reduced to 0
      expect(result.row.health).toBe(5) // 10 - (8 - 3) = 5
    })
  })

  describe('hpFunctions', () => {
    const mockRow = {
      id: '1',
      health: 10,
      maxHealth: 20,
      tempHealth: 0,
    } as InitiativeSheetRow

    beforeEach(() => {
      mockRow.health = 10
      mockRow.maxHealth = 20
      mockRow.tempHealth = 0
    })

    it('Should not exceed maxHealth when health is healed', () => {
      hpFunctions.heal(mockRow, 15)

      expect(mockRow.health).toBe(20)
    })

    it('Should damage reduce tempHealth first', () => {
      mockRow.tempHealth = 5
      hpFunctions.damage(mockRow, 3)

      expect(mockRow.tempHealth).toBe(2)
      expect(mockRow.health).toBe(10)
    })

    it('Should temp set tempHealth', () => {
      hpFunctions.temp(mockRow, 8)

      expect(mockRow.tempHealth).toBe(8)
    })

    it('Should override update health and maxHealth', () => {
      hpFunctions.override(mockRow, 15)

      expect(mockRow.health).toBe(15)
      expect(mockRow.maxHealth).toBe(15)
      expect(mockRow.maxHealthOld).toBe(20)
    })
  })

  describe('acFunctions', () => {
    const mockRow = {
      id: '1',
      ac: 15,
      maxAc: 15,
      tempAc: 0,
    } as InitiativeSheetRow

    beforeEach(() => {
      mockRow.ac = 15
      mockRow.maxAc = 15
      mockRow.tempAc = 0
    })

    it('Should not exceed maxAc when ac is added', () => {
      acFunctions.add(mockRow, 10)

      expect(mockRow.ac).toBe(15)
    })

    it('Should remove reduce tempAc first', () => {
      mockRow.tempAc = 5
      acFunctions.remove(mockRow, 3)

      expect(mockRow.tempAc).toBe(2)
      expect(mockRow.ac).toBe(15)
    })

    it('Should temp set tempAc', () => {
      acFunctions.temp(mockRow, 8)

      expect(mockRow.tempAc).toBe(8)
    })
  })

  describe('deathSavesFunctions', () => {
    it('Should hasDeathSaves return false for summon and lair types', () => {
      expect(deathSavesFunctions.hasDeathSaves('summon')).toBe(false)
      expect(deathSavesFunctions.hasDeathSaves('lair')).toBe(false)
    })

    it('Should checkDeathSaves detect failed saves', () => {
      const deathSaves: DeathSaves = {
        fail: [true, true, true],
        save: [false, false, false],
      }
      const result = deathSavesFunctions.checkDeathSaves(deathSaves)

      expect(result.failed).toBe(true)
      expect(result.saved).toBe(false)
    })

    it('Should addDeathSave add saves correctly', () => {
      const deathSaves: DeathSaves = {
        fail: [false, false, false],
        save: [false, false, false],
      }
      const result = deathSavesFunctions.addDeathSave(deathSaves, 'fail', 2)

      expect(result.fail).toEqual([true, true, false])
    })
  })

  describe('indexCorrect', () => {
    it('Should indexCorrect sort rows by initiative and add index', () => {
      const rows = [
        { id: '1', initiative: 15 },
        { id: '2', initiative: 20 },
        { id: '3', initiative: 10 },
      ] as InitiativeSheetRow[]

      const result = indexCorrect(rows)

      expect(result[0]?.initiative).toBe(20)
      expect(result[0]?.index).toBe(0)
      expect(result[1]?.initiative).toBe(15)
      expect(result[1]?.index).toBe(1)
      expect(result[2]?.initiative).toBe(10)
      expect(result[2]?.index).toBe(2)
    })
  })

  describe('getCurrentRowIndex', () => {
    it('Should getCurrentRowIndex return correct index for existing id', () => {
      const index = getCurrentRowIndex(sheet, sheet.rows[0]?.id ?? '')
      expect(index).toBe(0)
    })

    it('Should getCurrentRowIndex return -1 for non-existent id', () => {
      const index = getCurrentRowIndex(sheet, 'non-existent-id')
      expect(index).toBe(-1)
    })
  })

  describe('getHP', () => {
    it('Should getHP return health from InitiativeSheetRow', () => {
      const row = { name: 'Test', health: 20 } as InitiativeSheetRow

      expect(getHP(row)).toBe(20)
    })

    it('Should getHP return hit_points from Open5eItem', () => {
      const item = { name: 'Test', hit_points: 30 } as Open5eItem

      expect(getHP(item)).toBe(30)
    })
  })

  describe('getAC', () => {
    it('Should getAC return ac from InitiativeSheetRow', () => {
      const row = { name: 'Test', ac: 15 } as InitiativeSheetRow

      expect(getAC(row)).toBe(15)
    })

    it('Should getAC return armor_class from Open5eItem', () => {
      const item = { name: 'Test', armor_class: 18 } as Open5eItem

      expect(getAC(item)).toBe(18)
    })
  })

  describe('createInitiativeRow', () => {
    it('Should createInitiativeRow create row with correct structure', () => {
      const formData = {
        name: 'Test',
        health: 20,
        ac: 15,
      }
      const row = createInitiativeRow(formData, 'monster', 0)

      expect(row).toHaveProperty('id')
      expect(row.health).toBe(20)
      expect(row.ac).toBe(15)
      expect(row.maxHealth).toBe(20)
      expect(row.maxAc).toBe(15)
      expect(row.deathSaves).toEqual({
        fail: [false, false, false],
        save: [false, false, false],
      })
    })
  })

  describe('hasMaxCharacters', () => {
    it('Should hasMaxCharacters return true when sheet has 50 rows', () => {
      const fullSheet = {
        ...sheet,
        rows: Array(50).fill(sheet.rows[0]),
      }

      expect(hasMaxCharacters(fullSheet)).toBe(true)
    })

    it('Should hasMaxCharacters return false when sheet has less than 50 rows', () => {
      expect(hasMaxCharacters(sheet)).toBe(false)
    })

    it('Should hasMaxCharacters return false when sheet is undefined', () => {
      expect(hasMaxCharacters(undefined)).toBe(false)
    })
  })
})
