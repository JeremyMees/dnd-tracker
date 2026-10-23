import { beforeEach, describe, expect, it } from 'vitest'
import {
  bloodiedCondition,
  storedBloodiedCondition,
} from '~~/test/fixtures/bloodied-condition'
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

    it('should add one death save failure when taking damage at 0 hp', () => {
      const row = { ...mockRow, hitPoints: 0 }
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.deathSaves?.fail).toEqual([true, true, false])
    })

    it('should add two death save failures when taking a critical hit at 0 hp', () => {
      const row = { ...mockRow, hitPoints: 0 }
      const result = handleHpChanges(10, 'damage', row, false, {
        critical: true,
      })

      expect(result.row.deathSaves?.fail).toEqual([true, true, true])
    })

    it('should not add death save failures to a monster at 0 hp', () => {
      const row = {
        ...mockRow,
        type: 'monster',
        hitPoints: 0,
      } as InitiativeSheetRow
      const result = handleHpChanges(10, 'damage', row, false)

      expect(result.row.deathSaves?.fail).toEqual([true, false, false])
    })

    describe('death', () => {
      const died = (description: string) => ({
        title: [
          'components.initiativeTable.died.title',
          { name: 'Sister Iarnă' },
        ],
        description: [description, { name: 'Sister Iarnă' }],
        variant: 'info',
      })

      it('should kill instantly when the leftover damage reaches max hp without negative hp', () => {
        const row = { ...mockRow, tempHitPoints: 0 }
        const result = handleHpChanges(110, 'damage', row, false)

        expect(result.row.hitPoints).toBe(0)
        expect(result.row.deathSaves).toEqual({
          fail: [true, true, true],
          save: [false, false, false],
        })
        expect(result.toasts).toContainEqual(
          died('components.initiativeTable.died.textMassiveDamage'),
        )
      })

      it('should kill instantly when the leftover damage reaches max hp with negative hp', () => {
        const row = { ...mockRow, tempHitPoints: 0 }
        const result = handleHpChanges(110, 'damage', row, true)

        expect(result.row.hitPoints).toBe(-100)
        expect(result.toasts).toContainEqual(
          died('components.initiativeTable.died.textMassiveDamage'),
        )
      })

      it('should kill instantly when damage at 0 hp reaches max hp', () => {
        const row = { ...mockRow, hitPoints: 0, tempHitPoints: 0 }
        const result = handleHpChanges(100, 'damage', row, false)

        expect(result.row.deathSaves?.fail).toEqual([true, true, true])
        expect(result.toasts).toContainEqual(
          died('components.initiativeTable.died.textMassiveDamage'),
        )
      })

      it('should let temp hp absorb damage before checking for instant death', () => {
        const result = handleHpChanges(114, 'damage', mockRow, false)

        expect(result.row.deathSaves?.fail).toEqual([true, false, false])
        expect(result.toasts).not.toContainEqual(
          died('components.initiativeTable.died.textMassiveDamage'),
        )
      })

      it('should not kill instantly when the leftover damage stays below max hp', () => {
        const row = { ...mockRow, tempHitPoints: 0 }
        const result = handleHpChanges(109, 'damage', row, false)

        expect(result.row.deathSaves?.fail).toEqual([true, false, false])
      })

      it('should not apply instant death to rows without death saves', () => {
        const row = {
          ...mockRow,
          type: 'monster',
          tempHitPoints: 0,
        } as InitiativeSheetRow
        const result = handleHpChanges(500, 'damage', row, false)

        expect(result.row.deathSaves?.fail).toEqual([true, false, false])
        expect(result.toasts).not.toContainEqual(
          died('components.initiativeTable.died.textMassiveDamage'),
        )
      })

      it('should toast the failed death saves when the last failure is added', () => {
        const row = { ...mockRow, hitPoints: 0, tempHitPoints: 0 }
        const result = handleHpChanges(5, 'damage', row, false, {
          critical: true,
        })

        expect(result.toasts).toContainEqual(
          died('components.initiativeTable.died.textDeathSaves'),
        )
      })

      it('should not toast again when the row was already dead', () => {
        const row = {
          ...mockRow,
          hitPoints: 0,
          tempHitPoints: 0,
          deathSaves: {
            fail: [true, true, true],
            save: [false, false, false],
          },
        } as InitiativeSheetRow
        const result = handleHpChanges(500, 'damage', row, false)

        expect(
          result.toasts.some(
            toast => toast.title[0] === 'components.initiativeTable.died.title',
          ),
        ).toBe(false)
      })
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

  describe('hp helpers', () => {
    const buildRow = (overrides: Partial<InitiativeSheetRow> = {}) =>
      ({
        ...sheet.rows[0]!,
        type: 'player',
        hitPoints: 10,
        maxHitPoints: 100,
        tempHitPoints: 0,
        concentration: false,
        conditions: [],
        deathSaves: undefined,
        ...overrides,
      }) as InitiativeSheetRow

    const allFailed: DndDeathSaves = {
      fail: [true, true, true],
      save: [false, false, false],
    }

    describe('hasNoHitPoints', () => {
      it.each([
        [0, true],
        [-5, true],
        [1, false],
        [undefined, false],
      ])('returns %s → %s', (hitPoints, expected) => {
        expect(hasNoHitPoints(buildRow({ hitPoints }))).toBe(expected)
      })
    })

    describe('isInstantDeath', () => {
      it('is true when the leftover damage reaches max hp', () => {
        expect(isInstantDeath(buildRow(), 110)).toBe(true)
      })

      it('is false when the leftover damage stays below max hp', () => {
        expect(isInstantDeath(buildRow(), 109)).toBe(false)
      })

      it('lets temp hp absorb damage first', () => {
        expect(isInstantDeath(buildRow({ tempHitPoints: 5 }), 114)).toBe(false)
        expect(isInstantDeath(buildRow({ tempHitPoints: 5 }), 115)).toBe(true)
      })

      it('ignores negative hp below zero', () => {
        expect(isInstantDeath(buildRow({ hitPoints: -50 }), 100)).toBe(true)
      })

      it('is false for rows without death saves', () => {
        expect(isInstantDeath(buildRow({ type: 'monster' }), 500)).toBe(false)
      })

      it('is false without hit points or max hit points', () => {
        expect(isInstantDeath(buildRow({ hitPoints: undefined }), 500)).toBe(
          false,
        )
        expect(isInstantDeath(buildRow({ maxHitPoints: undefined }), 500)).toBe(
          false,
        )
      })
    })

    describe('healHitPoints', () => {
      it('heals up to max hit points', () => {
        const row = buildRow({ hitPoints: 95 })

        healHitPoints(row, 10)

        expect(row.hitPoints).toBe(100)
      })

      it('resets death saves when healing a downed player', () => {
        const row = buildRow({ hitPoints: 0, deathSaves: allFailed })

        healHitPoints(row, 5)

        expect(row.hitPoints).toBe(5)
        expect(row.deathSaves).toEqual({
          fail: [false, false, false],
          save: [false, false, false],
        })
      })

      it('keeps death saves when the row still had hit points', () => {
        const deathSaves: DndDeathSaves = {
          fail: [true, false, false],
          save: [false, false, false],
        }
        const row = buildRow({ deathSaves })

        healHitPoints(row, 5)

        expect(row.deathSaves).toBe(deathSaves)
      })

      it('keeps death saves for rows without death saves', () => {
        const row = buildRow({
          type: 'monster',
          hitPoints: 0,
          deathSaves: allFailed,
        } as Partial<InitiativeSheetRow>)

        healHitPoints(row, 5)

        expect(row.deathSaves).toBe(allFailed)
      })
    })

    describe('damageHitPoints', () => {
      const options = { critical: false, instantDeath: false }

      it('removes temp hit points before hit points', () => {
        const row = buildRow({ tempHitPoints: 5 })

        damageHitPoints(row, 8, options)

        expect(row.tempHitPoints).toBe(0)
        expect(row.hitPoints).toBe(7)
      })

      it('starts death saves with one failure when hit at 0 hp', () => {
        const row = buildRow({ hitPoints: 0 })

        damageHitPoints(row, 5, options)

        expect(row.deathSaves).toEqual({
          fail: [true, false, false],
          save: [false, false, false],
        })
      })

      it('adds two failures on a critical hit at 0 hp', () => {
        const row = buildRow({ hitPoints: 0 })

        damageHitPoints(row, 5, { ...options, critical: true })

        expect(row.deathSaves?.fail).toEqual([true, true, false])
      })

      it('does not add failures when the hit only drops the row to 0 hp', () => {
        const row = buildRow()

        damageHitPoints(row, 10, options)

        expect(row.deathSaves).toBeUndefined()
      })

      it('fails every death save on instant death', () => {
        const row = buildRow()

        damageHitPoints(row, 110, { ...options, instantDeath: true })

        expect(row.deathSaves).toEqual(allFailed)
      })

      it('returns a concentration toast when the row stays up', () => {
        const row = buildRow({ concentration: true })

        expect(damageHitPoints(row, 4, options)).toEqual([
          {
            title: ['components.initiativeTable.concentration.title'],
            description: [
              'components.initiativeTable.concentration.text',
              { name: 'Sister Iarnă', dc: 10 },
            ],
            variant: 'info',
          },
        ])
      })

      it('drops concentration and conditions with a toast when downed', () => {
        const row = buildRow({
          concentration: true,
          conditions: [{ desc: 'Prone', name: 'Prone', id: 'prone' }],
        })

        const toasts = damageHitPoints(row, 10, options)

        expect(row.concentration).toBe(false)
        expect(row.conditions).toEqual([])
        expect(toasts).toEqual([
          {
            title: [
              'components.initiativeTable.downed.title',
              { name: 'Sister Iarnă' },
            ],
            description: [
              'components.initiativeTable.downed.text',
              { name: 'Sister Iarnă' },
            ],
            variant: 'info',
          },
        ])
      })

      it('keeps leveled conditions like exhaustion when downed', () => {
        const exhaustion: DndCondition = {
          desc: 'Exhaustion',
          name: 'Exhaustion',
          id: 'exhaustion',
          hasLevels: true,
          level: 2,
        }
        const row = buildRow({
          conditions: [
            { desc: 'Prone', name: 'Prone', id: 'prone' },
            exhaustion,
          ],
        })

        const toasts = damageHitPoints(row, 10, options)

        expect(row.conditions).toEqual([exhaustion])
        expect(toasts).toHaveLength(1)
      })

      it('returns no toasts when downed with only leveled conditions', () => {
        const row = buildRow({
          conditions: [
            {
              desc: 'Exhaustion',
              name: 'Exhaustion',
              id: 'exhaustion',
              hasLevels: true,
              level: 1,
            },
          ],
        })

        expect(damageHitPoints(row, 10, options)).toEqual([])
        expect(row.conditions).toHaveLength(1)
      })

      it('returns no toasts when downed without concentration or conditions', () => {
        expect(damageHitPoints(buildRow(), 10, options)).toEqual([])
      })
    })

    describe('deathSaveToasts', () => {
      const options = { wasDead: false, instantDeath: false }
      const died = (description: string) => ({
        title: [
          'components.initiativeTable.died.title',
          { name: 'Sister Iarnă' },
        ],
        description: [description, { name: 'Sister Iarnă' }],
        variant: 'info',
      })

      it('returns nothing without death saves', () => {
        expect(deathSaveToasts(buildRow(), options)).toEqual([])
      })

      it('returns the died toast for failed death saves', () => {
        const row = buildRow({ deathSaves: allFailed })

        expect(deathSaveToasts(row, options)).toEqual([
          died('components.initiativeTable.died.textDeathSaves'),
        ])
      })

      it('returns the massive damage text on instant death', () => {
        const row = buildRow({ deathSaves: allFailed })

        expect(
          deathSaveToasts(row, { ...options, instantDeath: true }),
        ).toEqual([died('components.initiativeTable.died.textMassiveDamage')])
      })

      it('returns nothing when the row was already dead', () => {
        const row = buildRow({ deathSaves: allFailed })

        expect(deathSaveToasts(row, { ...options, wasDead: true })).toEqual([])
      })

      it('returns the stable toast for successful death saves', () => {
        const row = buildRow({
          deathSaves: { fail: [false, false, false], save: [true, true, true] },
        })

        expect(deathSaveToasts(row, options)).toEqual([
          {
            title: [
              'components.initiativeTable.stable.title',
              { name: 'Sister Iarnă' },
            ],
            description: [
              'components.initiativeTable.stable.textDeathSaves',
              { name: 'Sister Iarnă' },
            ],
            variant: 'info',
          },
        ])
      })

      it('returns nothing when both saves and failures are full', () => {
        const row = buildRow({
          deathSaves: { fail: [true, true, true], save: [true, true, true] },
        })

        expect(deathSaveToasts(row, options)).toEqual([])
      })

      it('returns nothing while death saves are still in progress', () => {
        const row = buildRow({
          deathSaves: {
            fail: [true, false, false],
            save: [true, false, false],
          },
        })

        expect(deathSaveToasts(row, options)).toEqual([])
      })
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

  describe('applyHpChange', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 80,
      maxHitPoints: 100,
      tempHitPoints: 0,
      concentration: false,
      resistancesAndImmunities: {
        damageImmunities: ['poison'],
        damageResistances: ['fire'],
        damageVulnerabilities: ['cold'],
        conditionImmunities: [],
      },
    }

    it('patches only the fields the change touched', () => {
      expect(applyHpChange(row, { type: 'heal', amount: 5 })).toEqual({
        patch: { hitPoints: 85 },
        toasts: [],
      })
    })

    it('applies damage defenses per roll', () => {
      const { patch } = applyHpChange(row, {
        type: 'damage',
        rolls: [
          { amount: 10, type: 'poison' },
          { amount: 10, type: 'fire' },
          { amount: 10, type: 'cold' },
          { amount: 3 },
        ],
      })

      expect(patch).toEqual({ hitPoints: 52 })
    })

    it('adds two death save failures on a critical hit at 0 hp', () => {
      const { patch } = applyHpChange(
        { ...row, hitPoints: 0 },
        { type: 'damage', rolls: [{ amount: 5 }], critical: true },
      )

      expect(patch.deathSaves).toEqual({
        fail: [true, true, false],
        save: [false, false, false],
      })
    })

    it('adds the bloodied condition it is given at half hp', () => {
      const { patch } = applyHpChange(
        row,
        { type: 'damage', rolls: [{ amount: 40 }] },
        { bloodied: bloodiedCondition },
      )

      expect(patch).toEqual({
        hitPoints: 40,
        conditions: [storedBloodiedCondition],
      })
    })

    it('removes bloodied when a heal lifts the row above half hp', () => {
      const { patch } = applyHpChange(
        { ...row, hitPoints: 40, conditions: [storedBloodiedCondition] },
        { type: 'heal', amount: 20 },
        { bloodied: bloodiedCondition },
      )

      expect(patch).toEqual({ hitPoints: 60, conditions: [] })
    })

    it('leaves conditions alone without a bloodied condition', () => {
      const { patch } = applyHpChange(row, {
        type: 'damage',
        rolls: [{ amount: 40 }],
      })

      expect(patch).toEqual({ hitPoints: 40 })
    })

    it.each([
      [false, 0],
      [true, -20],
    ])('with negative hp %s, damage stops at %i', (negative, hitPoints) => {
      const { patch } = applyHpChange(
        row,
        { type: 'damage', rolls: [{ amount: 100 }] },
        { negative },
      )

      expect(patch.hitPoints).toBe(hitPoints)
    })

    it('returns the concentration check message', () => {
      const { toasts } = applyHpChange(
        { ...row, concentration: true },
        { type: 'damage', rolls: [{ amount: 30 }] },
      )

      expect(toasts).toEqual([
        expect.objectContaining({
          description: [
            'components.initiativeTable.concentration.text',
            { name: 'Elara', dc: 15 },
          ],
        }),
      ])
    })

    it('overrides and resets the max hit points', () => {
      const { patch } = applyHpChange(row, { type: 'override', amount: 120 })

      expect(patch).toEqual({
        hitPoints: 100,
        maxHitPoints: 120,
        maxHitPointsOld: 100,
      })

      const overridden = { ...row, ...patch }

      expect(
        applyHpChange(overridden, { type: 'override-reset', amount: 100 })
          .patch,
      ).toEqual({ maxHitPoints: 100, maxHitPointsOld: undefined })
    })

    it('does not change the row it is given', () => {
      const before = structuredClone(row)

      applyHpChange(
        row,
        { type: 'damage', rolls: [{ amount: 90 }] },
        { bloodied: bloodiedCondition },
      )

      expect(row).toEqual(before)
    })
  })

  describe('applyAcChange', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      armorClass: 15,
      maxArmorClass: 18,
      tempArmorClass: 2,
    }

    it('patches only the fields the change touched', () => {
      expect(applyAcChange(row, { type: 'add', amount: 1 })).toEqual({
        armorClass: 16,
      })
    })

    it('spends temp AC first', () => {
      expect(applyAcChange(row, { type: 'remove', amount: 5 })).toEqual({
        armorClass: 12,
        tempArmorClass: 0,
      })
    })

    it.each([
      [false, 0],
      [true, -3],
    ])('with negative AC %s, removal stops at %i', (negative, armorClass) => {
      expect(
        applyAcChange(row, { type: 'remove', amount: 20 }, { negative })
          .armorClass,
      ).toBe(armorClass)
    })

    it('overrides the max armor class', () => {
      expect(applyAcChange(row, { type: 'override', amount: 20 })).toEqual({
        armorClass: 17,
        maxArmorClass: 20,
        maxArmorClassOld: 18,
      })
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

  describe('isBloodied', () => {
    it.each([
      [50, 100, true],
      [1, 100, true],
      [5, 9, false],
      [4, 9, true],
      [51, 100, false],
      [0, 100, false],
      [-5, 100, false],
      [5, 0, false],
      [undefined, 100, false],
      [50, undefined, false],
    ])('treats %s/%s hp as bloodied: %s', (hitPoints, maxHitPoints, result) => {
      expect(isBloodied(hitPoints, maxHitPoints)).toBe(result)
    })
  })

  describe('isBloodiedEnabled', () => {
    it.each([
      [undefined, true],
      [{ spacing: 'normal', modified: false }, true],
      [{ spacing: 'normal', modified: false, bloodied: true }, true],
      [{ spacing: 'normal', modified: false, bloodied: false }, false],
    ] as [InitiativeSettings | undefined, boolean][])(
      'reads %o as enabled: %s',
      (settings, result) => {
        expect(isBloodiedEnabled(settings)).toBe(result)
      },
    )
  })

  describe('isSkipDeadMonstersEnabled', () => {
    it.each([
      [undefined, true],
      [null, true],
      [{ spacing: 'normal', modified: false }, true],
      [{ spacing: 'normal', modified: false, skipDeadMonsters: true }, true],
      [{ spacing: 'normal', modified: false, skipDeadMonsters: false }, false],
    ] as [InitiativeSettings | null | undefined, boolean][])(
      'reads %o as enabled: %s',
      (settings, result) => {
        expect(isSkipDeadMonstersEnabled(settings)).toBe(result)
      },
    )
  })

  describe('isAutoRollInitiativeEnabled', () => {
    it.each([
      [undefined, true],
      [{ spacing: 'normal', modified: false }, true],
      [{ spacing: 'normal', modified: false, autoRollInitiative: true }, true],
      [
        { spacing: 'normal', modified: false, autoRollInitiative: false },
        false,
      ],
    ] as [InitiativeSettings | undefined, boolean][])(
      'reads %o as enabled: %s',
      (settings, result) => {
        expect(isAutoRollInitiativeEnabled(settings)).toBe(result)
      },
    )
  })

  describe('withoutBloodied', () => {
    it('drops only the bloodied condition', () => {
      const prone: DndCondition = { id: 'prone', name: 'Prone', desc: '' }
      const bloodied: DndCondition = {
        id: 'bloodied',
        name: 'Bloodied',
        desc: '',
      }

      expect(withoutBloodied([prone, bloodied])).toEqual([prone])
      expect(withoutBloodied([])).toEqual([])
    })
  })

  describe('withBloodied', () => {
    const bloodied: DndCondition = {
      id: 'bloodied',
      name: 'Bloodied',
      desc: 'At half hit points or fewer.',
      level: null,
      hasLevels: null,
    }
    const prone: DndCondition = { id: 'prone', name: 'Prone', desc: '' }
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'monster',
      conditions: [prone],
      hitPoints: 40,
      maxHitPoints: 100,
    }

    it('adds a sanitized bloodied condition at half hp or lower', () => {
      expect(withBloodied(row, bloodied).conditions).toEqual([
        prone,
        { id: 'bloodied', name: 'Bloodied', desc: '' },
      ])
    })

    it('removes bloodied once the row is above half hp', () => {
      const healed = { ...row, hitPoints: 80, conditions: [prone, bloodied] }

      expect(withBloodied(healed, bloodied).conditions).toEqual([prone])
    })

    it('removes bloodied when the row drops to 0 hp', () => {
      const downed = { ...row, hitPoints: 0, conditions: [bloodied] }

      expect(withBloodied(downed, bloodied).conditions).toEqual([])
    })

    it('returns the same row when nothing changes', () => {
      const applied = { ...row, conditions: [bloodied] }
      const healthy = { ...row, hitPoints: 90 }

      expect(withBloodied(applied, bloodied)).toBe(applied)
      expect(withBloodied(healthy, bloodied)).toBe(healthy)
    })

    it('leaves the row alone without a bloodied condition to apply', () => {
      const applied = { ...row, hitPoints: 90, conditions: [bloodied] }

      expect(withBloodied(row)).toBe(row)
      expect(withBloodied(applied)).toBe(applied)
    })
  })
})
