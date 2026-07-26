import { describe, expect, it } from 'vitest'
import { sheet } from '~~/test/nuxt/fixtures/initiative-sheet'

describe('dnd/row', () => {
  describe('indexCorrect', () => {
    it('should sort rows by initiative and add index', () => {
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

  describe('sanitizeRowNumbers', () => {
    it('should coerce string integer fields to numbers', () => {
      const row = {
        id: '1',
        armorClass: '15',
        hitPoints: '20',
        tempArmorClass: '2',
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBe(15)
      expect(result.hitPoints).toBe(20)
      expect(result.tempArmorClass).toBe(2)
    })

    it('should round float values to integers', () => {
      const row = {
        id: '1',
        armorClass: 15.6,
        maxHitPoints: 20.2,
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBe(16)
      expect(result.maxHitPoints).toBe(20)
    })

    it('should turn invalid values into undefined', () => {
      const row = {
        id: '1',
        armorClass: '',
        hitPoints: 'abc',
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBeUndefined()
      expect(result.hitPoints).toBeUndefined()
    })

    it('should leave non-numeric fields untouched', () => {
      const row = {
        id: '1',
        name: 'Goblin',
        armorClass: 15,
        conditions: [],
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.name).toBe('Goblin')
      expect(result.id).toBe('1')
      expect(result.conditions).toEqual([])
    })
  })

  describe('getCurrentRowIndex', () => {
    it('should return correct index for existing id', () => {
      const index = getCurrentRowIndex(sheet, sheet.rows[0]?.id ?? '')
      expect(index).toBe(0)
    })

    it('should return -1 for non-existent id', () => {
      const index = getCurrentRowIndex(sheet, 'non-existent-id')
      expect(index).toBe(-1)
    })
  })

  describe('createInitiativeRow', () => {
    it('should create row with expected base structure', () => {
      const formData = {
        name: 'Test',
        hitPoints: 20,
        armorClass: 15,
      }

      const row = createInitiativeRow(formData, 'monster', 0)

      expect(row).toHaveProperty('id')
      expect(row.hitPoints).toBe(20)
      expect(row.armorClass).toBe(15)
      expect(row.maxHitPoints).toBe(20)
      expect(row.maxArmorClass).toBe(15)
      expect(row.conditions).toEqual([])
      expect(row.deathSaves).toEqual({
        fail: [false, false, false],
        save: [false, false, false],
      })
    })

    it('should preserve extended homebrew fields from formData', () => {
      const abilityScores = {
        strength: 10,
        dexterity: 14,
        constitution: 12,
        intelligence: 8,
        wisdom: 10,
        charisma: 16,
      } as DndAbilityScores
      const traits = [
        { name: 'Brave', desc: 'Advantage on saves vs fear' },
      ] as DndTrait[]
      const formData = {
        name: 'Homebrew Monster',
        hitPoints: 30,
        armorClass: 13,
        abilityScores,
        traits,
        proficiencyBonus: 2,
        passivePerception: 12,
      }

      const row = createInitiativeRow(formData, 'monster', 0)

      expect(row.abilityScores).toEqual(abilityScores)
      expect(row.traits).toEqual(traits)
      expect(row.proficiencyBonus).toBe(2)
      expect(row.passivePerception).toBe(12)
    })
  })
})
