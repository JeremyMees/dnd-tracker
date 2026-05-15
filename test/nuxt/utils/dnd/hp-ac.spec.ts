import { beforeEach, describe, expect, it } from 'vitest'
import { sheet } from '~~/test/nuxt/fixtures/initiative-sheet'

describe('dnd/hp-ac', () => {
  describe('handleHpChanges', () => {
    const mockRow: InitiativeSheetRow = sheet.rows[0]!

    beforeEach(() => {
      mockRow.hitPoints = 10
      mockRow.maxHitPoints = 100
      mockRow.tempHitPoints = 5
      mockRow.maxHitPointsOld = 10
      mockRow.concentration = true
      mockRow.conditions = [{ desc: 'Paralyzed', name: 'Paralyzed', id: 'paralyzed' }]
      mockRow.deathSaves = {
        fail: [true, false, false],
        save: [true, false, false],
      }
    })

    it('should heal hitPoints correctly', () => {
      const result = handleHpChanges(10, 'heal', mockRow, false)
      expect(result.row.hitPoints).toBe(20)
      expect(result.toasts).toHaveLength(0)
    })

    it('should add death save failures when taking damage at 0 hp', () => {
      const row = { ...mockRow, hitPoints: 0 }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.deathSaves?.fail).toEqual([true, true, true])
    })

    it('should show stable toast when saves are successful', () => {
      const row = {
        ...mockRow,
        hitPoints: 0,
        deathSaves: {
          save: [true, true, true],
          fail: [false, false, false],
        },
      } as InitiativeSheetRow
      const result = handleHpChanges(10, 'temp', row, false)

      expect(result.toasts).toHaveLength(1)
      expect(result.toasts[0]?.title).toEqual(['components.initiativeTable.stable.title', { name: 'Sister Iarnă' }])
    })

    it('should clamp to zero when negative hp is not allowed', () => {
      const row = { ...mockRow, hitPoints: 10, tempHitPoints: 0 }
      const result = handleHpChanges(15, 'damage', row, false)

      expect(result.row.hitPoints).toBe(0)
    })
  })

  describe('hpFunctions', () => {
    const mockRow = {
      id: '1',
      hitPoints: 10,
      maxHitPoints: 20,
      tempHitPoints: 0,
    } as InitiativeSheetRow

    beforeEach(() => {
      mockRow.hitPoints = 10
      mockRow.maxHitPoints = 20
      mockRow.tempHitPoints = 0
    })

    it('should not exceed maxHitPoints when healing', () => {
      hpFunctions.heal(mockRow, 15)
      expect(mockRow.hitPoints).toBe(20)
    })

    it('should set temp hitPoints', () => {
      hpFunctions.temp(mockRow, 8)
      expect(mockRow.tempHitPoints).toBe(8)
    })
  })

  describe('acFunctions', () => {
    const mockRow = {
      id: '1',
      armorClass: 15,
      maxArmorClass: 15,
      tempArmorClass: 0,
    } as InitiativeSheetRow

    beforeEach(() => {
      mockRow.armorClass = 15
      mockRow.maxArmorClass = 15
      mockRow.tempArmorClass = 0
    })

    it('should not exceed maxArmorClass when adding', () => {
      acFunctions.add(mockRow, 10)
      expect(mockRow.armorClass).toBe(15)
    })

    it('should set temp armorClass', () => {
      acFunctions.temp(mockRow, 8)
      expect(mockRow.tempArmorClass).toBe(8)
    })
  })

  describe('getHP/getAC', () => {
    it('should read hitPoints from row shape', () => {
      const row = { name: 'Test', hitPoints: 20 } as Partial<InitiativeSheetRow> & { name: string }
      expect(getHP(row)).toBe(20)
    })

    it('should read hitPoints from DndMonster shape', () => {
      const monster = { name: 'Test', hitPoints: 30 } as unknown as DndMonster
      expect(getHP(monster)).toBe(30)
    })

    it('should read armorClass from row and DndMonster shapes', () => {
      const row = { name: 'Test', armorClass: 15 } as Partial<InitiativeSheetRow> & { name: string }
      const monster = { name: 'Test', armorClass: 18 } as unknown as DndMonster

      expect(getAC(row)).toBe(15)
      expect(getAC(monster)).toBe(18)
    })
  })
})
