import { describe, expect, it, vi } from 'vitest'

function action(name: string, overrides: Partial<DndAction> = {}): DndAction {
  return { name, desc: '', attacks: [], actionType: 'action', ...overrides }
}

function row(overrides: Partial<InitiativeSheetRow> = {}): InitiativeSheetRow {
  return {
    id: 'dragon',
    name: 'Dragon',
    index: 0,
    initiative: 10,
    type: 'monster',
    conditions: [],
    ...overrides,
  }
}

const breath = action('Fire Breath', {
  usageLimits: { type: 'recharge', param: 5 },
})
const frighten = action('Frightful Presence', {
  usageLimits: { type: 'perDay', param: 3 },
})
const tail = action('Tail Attack', { actionType: 'legendaryAction' })

describe('dnd/resources', () => {
  describe('legendaryActionLimit', () => {
    it('gives three legendary actions to a row with legendary actions', () => {
      expect(legendaryActionLimit({ actions: [tail] })).toBe(3)
    })

    it('gives none to a row without legendary actions', () => {
      expect(legendaryActionLimit({ actions: [breath] })).toBe(0)
      expect(legendaryActionLimit({})).toBe(0)
    })
  })

  describe('legendaryResistanceLimit', () => {
    it.each([
      ['Legendary Resistance (3/Day)', 3],
      ['Legendary Resistance (3/Day, or 4/Day in Lair)', 3],
      ['legendary resistance (2 / day)', 2],
    ])('reads %s from the traits', (name, expected) => {
      expect(legendaryResistanceLimit({ traits: [{ name, desc: '' }] })).toBe(
        expected,
      )
    })

    it('reads it from a special ability', () => {
      expect(
        legendaryResistanceLimit({
          actions: [
            action('Legendary Resistance (1/Day)', {
              actionType: 'specialAbility',
            }),
          ],
        }),
      ).toBe(1)
    })

    it('gives none without the trait', () => {
      expect(
        legendaryResistanceLimit({
          traits: [{ name: 'Amphibious', desc: '' }],
        }),
      ).toBe(0)
    })
  })

  describe('actionUseLimit', () => {
    it.each([
      [{ type: 'recharge', param: 5 }, 1],
      [{ type: 'perDay', param: 3 }, 3],
      [{ type: 'perRest', param: 1 }, 1],
      [{ type: 'atWill', param: 0 }, 0],
      [undefined, 0],
    ] as [DndUsageLimits | undefined, number][])(
      'limits %o to %i uses',
      (usageLimits, expected) => {
        expect(actionUseLimit({ usageLimits })).toBe(expected)
      },
    )
  })

  describe('actionUsesLeft', () => {
    it('counts the uses left of a limited action', () => {
      expect(
        actionUsesLeft({ actions: { [frighten.name]: 1 } }, frighten),
      ).toBe(2)
    })

    it('has every use left without resources', () => {
      expect(actionUsesLeft(undefined, frighten)).toBe(3)
    })

    it('has no uses left once a recharge is used', () => {
      expect(actionUsesLeft({ actions: { [breath.name]: 1 } }, breath)).toBe(0)
    })

    it('has no uses for an unlimited action', () => {
      expect(actionUsesLeft(undefined, tail)).toBe(0)
    })
  })

  describe('markActionUsed', () => {
    it('uses up a recharge', () => {
      expect(markActionUsed({ reaction: true }, breath)).toEqual({
        reaction: true,
        actions: { [breath.name]: 1 },
      })
    })

    it('adds a use to a per day action', () => {
      expect(
        markActionUsed(
          { actions: { [frighten.name]: 1, [breath.name]: 1 } },
          frighten,
        ),
      ).toEqual({ actions: { [frighten.name]: 2, [breath.name]: 1 } })
    })

    it('never goes above the limit', () => {
      expect(
        markActionUsed({ actions: { [frighten.name]: 3 } }, frighten),
      ).toEqual({ actions: { [frighten.name]: 3 } })
    })
  })

  describe('limitedActions', () => {
    it('keeps only the actions with a use limit', () => {
      expect(limitedActions({ actions: [breath, tail, frighten] })).toEqual([
        breath,
        frighten,
      ])
    })
  })

  describe('hasResources', () => {
    it.each([
      [{ actions: [tail] }, true],
      [{ traits: [{ name: 'Legendary Resistance (3/Day)', desc: '' }] }, true],
      [{ actions: [frighten] }, true],
      [{ actions: [action('Bite')] }, false],
      [{}, false],
    ])('is %o → %s', (resourceRow, expected) => {
      expect(hasResources(resourceRow)).toBe(expected)
    })
  })

  describe('refreshResources', () => {
    it('keeps a row without resources as is', () => {
      const dragon = row({ actions: [breath] })

      expect(refreshResources(dragon)).toEqual({ row: dragon, recharges: [] })
    })

    it('restores legendary actions and the reaction', () => {
      const dragon = row({
        resources: {
          legendaryActions: 2,
          reaction: true,
          legendaryResistances: 1,
        },
      })

      expect(refreshResources(dragon).row.resources).toEqual({
        legendaryResistances: 1,
      })
    })

    it('recharges a spent action on a high enough roll', () => {
      const dragon = row({
        actions: [breath],
        resources: { actions: { 'Fire Breath': 1 } },
      })

      const result = refreshResources(dragon, () => 5)

      expect(result.row.resources).toEqual({})
      expect(result.recharges).toEqual([
        {
          rowId: 'dragon',
          rowName: 'Dragon',
          action: 'Fire Breath',
          roll: 5,
          recharged: true,
        },
      ])
    })

    it('keeps the action spent and the row as is on a low roll', () => {
      const dragon = row({
        actions: [breath],
        resources: { actions: { 'Fire Breath': 1 } },
      })

      const result = refreshResources(dragon, () => 4)

      expect(result.row).toBe(dragon)
      expect(result.recharges).toEqual([
        expect.objectContaining({ roll: 4, recharged: false }),
      ])
    })

    it('does not roll for a ready recharge action or a per day action', () => {
      const roll = vi.fn(() => 6)
      const dragon = row({
        actions: [breath, frighten],
        resources: { actions: { 'Frightful Presence': 2 } },
      })

      const result = refreshResources(dragon, roll)

      expect(roll).not.toHaveBeenCalled()
      expect(result.row).toBe(dragon)
    })

    it('keeps per day uses when a recharge comes back', () => {
      const dragon = row({
        actions: [breath, frighten],
        resources: { actions: { 'Fire Breath': 1, 'Frightful Presence': 2 } },
      })

      expect(refreshResources(dragon, () => 6).row.resources).toEqual({
        actions: { 'Frightful Presence': 2 },
      })
    })
  })
})
