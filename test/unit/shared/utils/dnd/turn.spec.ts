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
