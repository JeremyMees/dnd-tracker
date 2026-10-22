import { describe, expect, it } from 'vitest'
import { combatLogSince, mergeCombatLog } from '~/utils/combat-log'

function event(id: number, createdAt: string): CombatEventRow {
  return {
    id,
    encounterId: 7,
    rowId: 'row-1',
    round: 1,
    type: 'hp',
    payload: {},
    createdBy: null,
    actorName: null,
    createdAt,
  }
}

describe('combat-log', () => {
  describe('combatLogSince', () => {
    it('is undefined without stored events', () => {
      expect(combatLogSince(undefined)).toBeUndefined()
      expect(combatLogSince([])).toBeUndefined()
    })

    it('ignores optimistic events that were never stored', () => {
      expect(
        combatLogSince([event(-1, '2026-10-22T10:00:00.000Z')]),
      ).toBeUndefined()
    })

    it('starts ten seconds before the newest stored event', () => {
      expect(
        combatLogSince([
          event(-1, '2026-10-22T11:00:00.000Z'),
          event(4, '2026-10-22T10:00:30.000Z'),
          event(3, '2026-10-22T10:00:00.000Z'),
        ]),
      ).toBe('2026-10-22T10:00:20.000Z')
    })
  })

  describe('mergeCombatLog', () => {
    it('adds new events newest first and drops optimistic ones', () => {
      const cached = [
        event(-5, '2026-10-22T10:00:40.000Z'),
        event(2, '2026-10-22T10:00:10.000Z'),
        event(1, '2026-10-22T10:00:00.000Z'),
      ]
      const fresh = [
        event(4, '2026-10-22T10:00:40.000Z'),
        event(3, '2026-10-22T10:00:30.000Z'),
      ]

      expect(mergeCombatLog(cached, fresh).map(({ id }) => id)).toEqual([
        4, 3, 2, 1,
      ])
    })

    it('keeps one copy of events returned again by the overlap', () => {
      const shared = event(2, '2026-10-22T10:00:10.000Z')
      const updated = { ...shared, actorName: 'Elara' }

      expect(
        mergeCombatLog(
          [shared, event(1, '2026-10-22T10:00:00.000Z')],
          [updated],
        ),
      ).toEqual([updated, event(1, '2026-10-22T10:00:00.000Z')])
    })
  })
})
