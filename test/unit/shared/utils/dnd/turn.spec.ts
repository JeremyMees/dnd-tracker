import { describe, expect, it, vi } from 'vitest'

function row(id: string, conditions: DndCondition[] = []): InitiativeSheetRow {
  return { id, name: id, index: 0, initiative: 10, type: 'monster', conditions }
}

function condition(duration?: DndConditionDuration): DndCondition {
  return { id: 'prone', name: 'Prone', desc: 'On the ground.', duration }
}

const breath: DndAction = {
  name: 'Fire Breath',
  desc: 'Exhales fire.',
  attacks: [],
  actionType: 'action',
  usageLimits: { type: 'recharge', param: 5 },
}

describe('dnd/turn', () => {
  describe('advanceTurn', () => {
    it('moves to the next row in the same round', () => {
      const result = advanceTurn({
        rows: [row('a'), row('b')],
        activeIndex: 0,
        round: 1,
      })

      expect(result.activeIndex).toBe(1)
      expect(result.round).toBe(1)
    })

    it('wraps to the first row and starts a new round', () => {
      const result = advanceTurn({
        rows: [row('a'), row('b')],
        activeIndex: 1,
        round: 3,
      })

      expect(result.activeIndex).toBe(0)
      expect(result.round).toBe(4)
    })

    it('leaves conditions without a duration untouched', () => {
      const rows = [row('a', [condition()]), row('b')]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]).toBe(rows[0])
      expect(result.expired).toEqual([])
      expect(result.saves).toEqual([])
    })

    it('counts down at the end of the tied turn', () => {
      const rows = [
        row('a', [condition({ rowId: 'a', timing: 'end', rounds: 3 })]),
        row('b'),
      ]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]?.conditions[0]?.duration?.rounds).toBe(2)
    })

    it('counts down at the start of the tied turn', () => {
      const rows = [
        row('a', [condition({ rowId: 'b', timing: 'start', rounds: 3 })]),
        row('b'),
      ]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]?.conditions[0]?.duration?.rounds).toBe(2)
    })

    it('does not count down on other turn boundaries', () => {
      const rows = [
        row('a', [condition({ rowId: 'a', timing: 'start', rounds: 3 })]),
        row('b'),
        row('c'),
      ]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]).toBe(rows[0])
    })

    it('removes the condition and reports it when the last round runs out', () => {
      const expiring = condition({ rowId: 'b', timing: 'end', rounds: 1 })
      const rows = [row('a'), row('b', [expiring])]

      const result = advanceTurn({ rows, activeIndex: 1, round: 1 })

      expect(result.rows[1]?.conditions).toEqual([])
      expect(result.expired).toEqual([
        { rowId: 'b', rowName: 'b', condition: expiring },
      ])
    })

    it('reminds about a save without rounds and keeps the condition', () => {
      const held = condition({
        rowId: 'a',
        timing: 'end',
        save: { ability: 'wisdom', dc: 13 },
      })
      const rows = [row('a', [held]), row('b')]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]).toBe(rows[0])
      expect(result.saves).toEqual([
        { rowId: 'a', rowName: 'a', condition: held },
      ])
    })

    it('reminds about a save and counts down when it has rounds left', () => {
      const held = condition({
        rowId: 'a',
        timing: 'end',
        rounds: 10,
        save: { ability: 'wisdom', dc: 13 },
      })
      const rows = [row('a', [held]), row('b')]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]?.conditions[0]?.duration?.rounds).toBe(9)
      expect(result.saves).toHaveLength(1)
      expect(result.expired).toEqual([])
    })

    it('does not remind about a save when the condition expires', () => {
      const held = condition({
        rowId: 'a',
        timing: 'end',
        rounds: 1,
        save: { ability: 'wisdom', dc: 13 },
      })

      const result = advanceTurn({
        rows: [row('a', [held]), row('b')],
        activeIndex: 0,
        round: 1,
      })

      expect(result.expired).toHaveLength(1)
      expect(result.saves).toEqual([])
    })

    it('falls back to the affected row when the tied row was removed', () => {
      const rows = [
        row('a', [condition({ rowId: 'gone', timing: 'end', rounds: 2 })]),
        row('b'),
      ]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]?.conditions[0]?.duration?.rounds).toBe(1)
    })

    it('ticks both boundaries when a single row ends and starts its turn', () => {
      const rows = [
        row('a', [
          condition({ rowId: 'a', timing: 'end', rounds: 2 }),
          {
            ...condition({ rowId: 'a', timing: 'start', rounds: 2 }),
            id: 'stunned',
          },
        ]),
      ]

      const result = advanceTurn({ rows, activeIndex: 0, round: 1 })

      expect(result.rows[0]?.conditions.map(c => c.duration?.rounds)).toEqual([
        1, 1,
      ])
      expect(result.round).toBe(2)
    })

    it('refreshes the resources of the row whose turn starts', () => {
      const dragon: InitiativeSheetRow = {
        ...row('b'),
        actions: [breath],
        resources: { legendaryActions: 2, actions: { 'Fire Breath': 1 } },
      }
      const roll = vi.fn(() => 5)

      const result = advanceTurn(
        { rows: [row('a'), dragon], activeIndex: 0, round: 1 },
        roll,
      )

      expect(roll).toHaveBeenCalledWith(6)
      expect(result.rows[1]?.resources).toEqual({})
      expect(result.recharges).toEqual([
        {
          rowId: 'b',
          rowName: 'b',
          action: 'Fire Breath',
          roll: 5,
          recharged: true,
        },
      ])
    })

    it('leaves the resources of the row whose turn ends alone', () => {
      const dragon: InitiativeSheetRow = {
        ...row('a'),
        actions: [breath],
        resources: { legendaryActions: 2, actions: { 'Fire Breath': 1 } },
      }
      const roll = vi.fn(() => 6)

      const result = advanceTurn(
        { rows: [dragon, row('b')], activeIndex: 0, round: 1 },
        roll,
      )

      expect(roll).not.toHaveBeenCalled()
      expect(result.rows[0]).toBe(dragon)
      expect(result.recharges).toEqual([])
    })

    describe('Dead monsters', () => {
      function dead(id: string): InitiativeSheetRow {
        return { ...row(id), hitPoints: 0 }
      }

      it('skips monsters at 0 hp', () => {
        const result = advanceTurn({
          rows: [row('a'), dead('b'), dead('c'), row('d')],
          activeIndex: 0,
          round: 1,
        })

        expect(result.activeIndex).toBe(3)
        expect(result.round).toBe(1)
      })

      it('starts a new round when it skips past the last row', () => {
        const result = advanceTurn({
          rows: [dead('a'), row('b'), dead('c')],
          activeIndex: 1,
          round: 2,
        })

        expect(result.activeIndex).toBe(1)
        expect(result.round).toBe(3)
      })

      it('does not skip players and npcs at 0 hp', () => {
        const result = advanceTurn({
          rows: [
            row('a'),
            { ...dead('b'), type: 'player' },
            { ...dead('c'), type: 'npc' },
          ],
          activeIndex: 0,
          round: 1,
        })

        expect(result.activeIndex).toBe(1)
      })

      it('refreshes the resources of the next living row', () => {
        const rows = [
          row('a'),
          {
            ...dead('b'),
            actions: [breath],
            resources: { actions: { 'Fire Breath': 1 } },
          },
          {
            ...row('c'),
            actions: [breath],
            resources: { actions: { 'Fire Breath': 1 } },
          },
        ] as InitiativeSheetRow[]

        const result = advanceTurn({ rows, activeIndex: 0, round: 1 }, () => 6)

        expect(result.rows[1]).toBe(rows[1])
        expect(result.recharges.map(({ rowId }) => rowId)).toEqual(['c'])
      })

      it('does not skip when the setting is off', () => {
        const result = advanceTurn({
          rows: [row('a'), dead('b'), row('c')],
          activeIndex: 0,
          round: 1,
          settings: {
            spacing: 'normal',
            modified: true,
            skipDeadMonsters: false,
          },
        })

        expect(result.activeIndex).toBe(1)
      })

      it('moves to the next row when every other row is dead', () => {
        const result = advanceTurn({
          rows: [dead('a'), dead('b')],
          activeIndex: 0,
          round: 1,
        })

        expect(result.activeIndex).toBe(1)
        expect(result.round).toBe(1)
      })
    })

    describe('readied rows', () => {
      it('clears a readied action when its row starts its turn', () => {
        const result = advanceTurn({
          rows: [row('a'), { ...row('b'), readied: true }],
          activeIndex: 0,
          round: 1,
        })

        expect(result.rows[1]?.readied).toBe(false)
      })

      it('keeps a readied action while other rows take their turn', () => {
        const readied = { ...row('c'), readied: true }
        const result = advanceTurn({
          rows: [row('a'), row('b'), readied],
          activeIndex: 0,
          round: 1,
        })

        expect(result.rows[2]).toBe(readied)
      })
    })

    it('handles an empty encounter', () => {
      expect(advanceTurn({ rows: [], activeIndex: 0, round: 1 })).toEqual({
        activeIndex: 0,
        round: 2,
        rows: [],
        expired: [],
        saves: [],
        recharges: [],
      })
    })
  })

  describe('previousTurnPosition', () => {
    const rows = [row('a'), row('b'), row('c')]

    it('steps back one row in the same round', () => {
      expect(previousTurnPosition({ rows, activeIndex: 2, round: 3 })).toEqual({
        activeIndex: 1,
        round: 3,
      })
    })

    it('wraps to the last row of the round before', () => {
      expect(previousTurnPosition({ rows, activeIndex: 0, round: 3 })).toEqual({
        activeIndex: 2,
        round: 2,
      })
    })

    it('stays put on the first turn of the encounter', () => {
      expect(
        previousTurnPosition({ rows, activeIndex: 0, round: 1 }),
      ).toBeUndefined()
    })
  })

  describe('resetEncounter', () => {
    const wounded: InitiativeSheetRow = {
      ...row('a', [condition()]),
      type: 'player',
      initiative: 18,
      hitPoints: 4,
      maxHitPoints: 40,
      maxHitPointsOld: 30,
      tempHitPoints: 5,
      armorClass: 12,
      maxArmorClass: 18,
      maxArmorClassOld: 15,
      tempArmorClass: 2,
      concentration: true,
      readied: true,
      deathSaves: { save: [true, false, false], fail: [true, true, false] },
    }

    it('goes back to the first turn and leaves rows alone on a soft reset', () => {
      expect(resetEncounter([row('a'), row('b')], { hard: false })).toEqual({
        activeIndex: 0,
        round: 1,
      })
    })

    it('clears readied actions on a soft reset', () => {
      const rows = [row('a'), { ...row('b'), readied: true }]

      expect(resetEncounter(rows, { hard: false }).rows).toEqual([
        { ...row('a'), readied: undefined },
        { ...row('b'), readied: undefined },
      ])
    })

    it('brings every row back to its base on a hard reset', () => {
      expect(resetEncounter([wounded], { hard: true })).toEqual({
        activeIndex: 0,
        round: 1,
        rows: [
          {
            ...wounded,
            initiative: -1,
            conditions: [],
            hitPoints: 30,
            maxHitPoints: 30,
            maxHitPointsOld: undefined,
            tempHitPoints: undefined,
            armorClass: 15,
            maxArmorClass: 15,
            maxArmorClassOld: undefined,
            tempArmorClass: undefined,
            concentration: false,
            readied: undefined,
            deathSaves: {
              save: [false, false, false],
              fail: [false, false, false],
            },
          },
        ],
      })
    })

    it('keeps the max on a hard reset when a cleared override is stored as null', () => {
      const [reset] = resetEncounter(
        [
          {
            ...wounded,
            maxHitPointsOld: null,
            maxArmorClassOld: null,
          },
        ],
        { hard: true },
      ).rows!

      expect(reset).toMatchObject({
        hitPoints: 40,
        maxHitPoints: 40,
        armorClass: 18,
        maxArmorClass: 18,
      })
    })

    it('keeps lair rows at initiative 20 on a hard reset', () => {
      const rows = [
        { ...row('lair'), type: 'lair' as const, initiative: 20 },
        { ...row('goblin'), initiative: 12 },
      ]

      expect(
        resetEncounter(rows, { hard: true }).rows!.map(item => item.initiative),
      ).toEqual([20, -1])
    })

    it('leaves out fields a row never had on a hard reset', () => {
      const [reset] = resetEncounter([row('a')], { hard: true }).rows!

      expect(reset).not.toHaveProperty('hitPoints')
      expect(reset).not.toHaveProperty('armorClass')
      expect(reset).not.toHaveProperty('concentration')
      expect(reset).not.toHaveProperty('deathSaves')
    })
  })

  describe('resolveSave', () => {
    it('removes only the saved condition', () => {
      const blinded = { ...condition(), id: 'blinded', name: 'Blinded' }

      expect(resolveSave(row('a', [condition(), blinded]), 'prone')).toEqual({
        conditions: [blinded],
      })
    })
  })

  describe('conditionDurationPreset', () => {
    it('ends at the end of the affected row its next turn', () => {
      expect(
        conditionDurationPreset('endOfNextTurn', {
          rowId: 'target',
          activeRowId: 'caster',
        }),
      ).toEqual({ rowId: 'target', timing: 'end', rounds: 1 })
    })

    it('skips the current turn when the affected row is the active one', () => {
      expect(
        conditionDurationPreset('endOfNextTurn', {
          rowId: 'target',
          activeRowId: 'target',
        }),
      ).toEqual({ rowId: 'target', timing: 'end', rounds: 2 })
    })

    it('ends at the start of the active row its next turn', () => {
      expect(
        conditionDurationPreset('startOfNextTurn', {
          rowId: 'target',
          activeRowId: 'caster',
        }),
      ).toEqual({ rowId: 'caster', timing: 'start', rounds: 1 })
    })

    it('lasts ten rounds counted on the active row its turn', () => {
      expect(
        conditionDurationPreset('oneMinute', {
          rowId: 'target',
          activeRowId: 'caster',
        }),
      ).toEqual({ rowId: 'caster', timing: 'start', rounds: 10 })
    })

    it('falls back to the affected row without an active row', () => {
      expect(
        conditionDurationPreset('startOfNextTurn', { rowId: 'target' }),
      ).toEqual({ rowId: 'target', timing: 'start', rounds: 1 })
    })
  })

  describe('spellDurationRounds', () => {
    it.each([
      ['1 round', 1],
      ['6 rounds', 6],
      ['1 turn', 1],
      ['1 minute', 10],
      ['10 minutes', 100],
      ['1 Minute', 10],
    ])('turns %s into %s rounds', (duration, rounds) => {
      expect(spellDurationRounds(duration)).toBe(rounds)
    })

    it.each([
      'instantaneous',
      '1 hour',
      '8 hours',
      'until dispelled',
      '1d4+2 rounds',
      'special',
    ])('gives no rounds for %s', duration => {
      expect(spellDurationRounds(duration)).toBeUndefined()
    })
  })

  describe('spellDurationPrefill', () => {
    it('counts a save spell on the affected row its turn end', () => {
      expect(
        spellDurationPrefill(
          { duration: '1 minute', savingThrowAbility: 'wisdom' },
          { rowId: 'target', activeRowId: 'caster' },
        ),
      ).toEqual({
        rowId: 'target',
        timing: 'end',
        rounds: 10,
        ability: 'wisdom',
      })
    })

    it('counts a spell without a save on the caster its turn start', () => {
      expect(
        spellDurationPrefill(
          { duration: '1 round', savingThrowAbility: null },
          { rowId: 'target', activeRowId: 'caster' },
        ),
      ).toEqual({ rowId: 'caster', timing: 'start', rounds: 1 })
    })

    it('leaves the rounds out when the spell outlasts a fight', () => {
      expect(
        spellDurationPrefill(
          { duration: '8 hours', savingThrowAbility: 'charisma' },
          { rowId: 'target' },
        ),
      ).toEqual({ rowId: 'target', timing: 'end', ability: 'charisma' })
    })

    it('falls back to the affected row without an active row', () => {
      expect(
        spellDurationPrefill(
          { duration: '1 minute', savingThrowAbility: null },
          { rowId: 'target' },
        ),
      ).toEqual({ rowId: 'target', timing: 'start', rounds: 10 })
    })
  })
})
