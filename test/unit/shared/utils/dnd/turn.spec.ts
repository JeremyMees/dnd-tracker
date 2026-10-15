import { describe, expect, it } from 'vitest'

function row(id: string, conditions: DndCondition[] = []): InitiativeSheetRow {
  return { id, name: id, index: 0, initiative: 10, type: 'monster', conditions }
}

function condition(duration?: DndConditionDuration): DndCondition {
  return { id: 'prone', name: 'Prone', desc: 'On the ground.', duration }
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

    it('handles an empty encounter', () => {
      expect(advanceTurn({ rows: [], activeIndex: 0, round: 1 })).toEqual({
        activeIndex: 0,
        round: 2,
        rows: [],
        expired: [],
        saves: [],
      })
    })
  })
})
