import { beforeEach, describe, expect, it } from 'vitest'
import { sheet } from '~~/test/fixtures/initiative-sheet'

describe('dnd/hp-ac', () => {
  describe('handleHpChanges', () => {
    const mockRow: InitiativeSheetRow = sheet.rows[0]!

    beforeEach(() => {
      mockRow.hitPoints = 10
      mockRow.maxHitPoints = 100
      mockRow.tempHitPoints = 5
      mockRow.maxHitPointsOld = 10
      mockRow.concentration = true
      mockRow.conditions = [
        { desc: 'Paralyzed', name: 'Paralyzed', id: 'paralyzed' },
      ]
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
      expect(result.toasts[0]?.title).toEqual([
        'components.initiativeTable.stable.title',
        { name: 'Sister Iarnă' },
      ])
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

    it('should override maxHitPoints and clamp current hitPoints when it exceeds the new max', () => {
      mockRow.hitPoints = 10
      mockRow.maxHitPoints = 20

      hpFunctions.override(mockRow, 5)

      expect(mockRow.maxHitPoints).toBe(5)
      expect(mockRow.hitPoints).toBe(5)
      expect(mockRow.maxHitPointsOld).toBe(20)
    })

    it('should override maxHitPoints and keep the current/max difference when the new max is larger', () => {
      mockRow.hitPoints = 10
      mockRow.maxHitPoints = 20

      hpFunctions.override(mockRow, 30)

      expect(mockRow.maxHitPoints).toBe(30)
      expect(mockRow.hitPoints).toBe(20)
    })

    it('should set hitPoints directly when there is no current hitPoints or max', () => {
      const row = { ...mockRow, hitPoints: undefined, maxHitPoints: undefined }

      hpFunctions.override(row, 15)

      expect(row.hitPoints).toBe(15)
      expect(row.maxHitPoints).toBe(15)
    })

    it('should restore the previous max on overrideReset when it fits under the current max', () => {
      mockRow.hitPoints = 5
      mockRow.maxHitPoints = 5
      mockRow.maxHitPointsOld = 20

      hpFunctions.overrideReset(mockRow, 30)

      expect(mockRow.hitPoints).toBe(20)
      expect(mockRow.maxHitPoints).toBe(30)
      expect(mockRow.maxHitPointsOld).toBeUndefined()
    })

    it('should keep the current/max difference on overrideReset when the old max exceeds the new max', () => {
      mockRow.hitPoints = 5
      mockRow.maxHitPoints = 30
      mockRow.maxHitPointsOld = 40

      hpFunctions.overrideReset(mockRow, 10)

      expect(mockRow.hitPoints).toBe(15)
      expect(mockRow.maxHitPoints).toBe(10)
    })

    it('should not touch hitPoints on overrideReset when there is no old max', () => {
      const row = {
        ...mockRow,
        hitPoints: 5,
        maxHitPoints: 30,
        maxHitPointsOld: undefined,
      }

      hpFunctions.overrideReset(row, 10)

      expect(row.hitPoints).toBe(5)
      expect(row.maxHitPoints).toBe(10)
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

  describe('handleAcChanges', () => {
    const row = {
      ...sheet.rows[0]!,
      armorClass: 10,
      maxArmorClass: 20,
      maxArmorClassOld: undefined,
      tempArmorClass: 0,
    }

    it.each([
      ['add', 5, { armorClass: 15, tempArmorClass: 0 }],
      ['remove', 4, { armorClass: 6, tempArmorClass: 0 }],
      ['temp', 3, { armorClass: 10, tempArmorClass: 3 }],
      [
        'override',
        25,
        { armorClass: 15, maxArmorClass: 25, maxArmorClassOld: 20 },
      ],
    ] as const)('Should apply %s', (type, amount, expected) => {
      expect(handleAcChanges(amount, type, row, false)).toMatchObject(expected)
    })

    it('Should reset an override back to the old base', () => {
      const overridden = {
        ...row,
        armorClass: 15,
        maxArmorClass: 25,
        maxArmorClassOld: 20,
      }

      expect(
        handleAcChanges(20, 'override-reset', overridden, false),
      ).toMatchObject({
        armorClass: 20,
        maxArmorClass: 20,
        maxArmorClassOld: undefined,
      })
    })

    it('Should clamp negative armor class to zero when not allowed', () => {
      expect(handleAcChanges(15, 'remove', row, false).armorClass).toBe(0)
    })

    it('Should keep negative armor class when allowed', () => {
      expect(handleAcChanges(15, 'remove', row, true).armorClass).toBe(-5)
    })

    it('Should not change the given row', () => {
      handleAcChanges(5, 'add', row, false)

      expect(row.armorClass).toBe(10)
    })
  })

  describe('getHP/getAC', () => {
    it('should read hitPoints from row shape', () => {
      const row = {
        name: 'Test',
        hitPoints: 20,
      } as Partial<InitiativeSheetRow> & { name: string }
      expect(getHP(row)).toBe(20)
    })

    it('should read hitPoints from DndMonster shape', () => {
      const monster = { name: 'Test', hitPoints: 30 } as unknown as DndMonster
      expect(getHP(monster)).toBe(30)
    })

    it('should read armorClass from row and DndMonster shapes', () => {
      const row = {
        name: 'Test',
        armorClass: 15,
      } as Partial<InitiativeSheetRow> & { name: string }
      const monster = { name: 'Test', armorClass: 18 } as unknown as DndMonster

      expect(getAC(row)).toBe(15)
      expect(getAC(monster)).toBe(18)
    })
  })

  describe('getBaseHP and getBaseAC', () => {
    it('should return the max values without an override', () => {
      expect(getBaseHP({ maxHitPoints: 30 })).toBe(30)
      expect(getBaseAC({ maxArmorClass: 15 })).toBe(15)
    })

    it('should return the value from before the override', () => {
      expect(getBaseHP({ maxHitPoints: 50, maxHitPointsOld: 30 })).toBe(30)
      expect(getBaseAC({ maxArmorClass: 20, maxArmorClassOld: 15 })).toBe(15)
    })

    it('should return undefined when the row has no values', () => {
      expect(getBaseHP({})).toBeUndefined()
      expect(getBaseAC({})).toBeUndefined()
    })
  })

  describe('withBaseStats', () => {
    const row = {
      ...sheet.rows[0]!,
      hitPoints: 4,
      maxHitPoints: 40,
      armorClass: 12,
      maxArmorClass: 14,
      maxHitPointsOld: undefined,
      maxArmorClassOld: undefined,
    }

    it('Should swap the current hit points and armor class for the base ones', () => {
      expect(withBaseStats(row)).toMatchObject({
        hitPoints: 40,
        armorClass: 14,
      })
    })

    it('Should prefer the base from before an override', () => {
      expect(
        withBaseStats({ ...row, maxHitPointsOld: 30, maxArmorClassOld: 11 }),
      ).toMatchObject({ hitPoints: 30, armorClass: 11 })
    })

    it('Should keep the other fields of the row', () => {
      const result = withBaseStats(row)

      expect(result.id).toBe(row.id)
      expect(result.name).toBe(row.name)
      expect(result.maxHitPoints).toBe(40)
    })
  })

  describe('getHealthBand', () => {
    it.each([
      [80, 100, 'healthy'],
      [40, 100, 'bloodied'],
      [10, 100, 'critical'],
      [0, 100, 'critical'],
      [5, 0, 'healthy'],
      [0, 0, 'critical'],
      [undefined, undefined, 'critical'],
    ])('bands %s/%s hp as %s', (hitPoints, maxHitPoints, band) => {
      expect(getHealthBand(hitPoints, maxHitPoints)).toBe(band)
    })
  })
})
