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
