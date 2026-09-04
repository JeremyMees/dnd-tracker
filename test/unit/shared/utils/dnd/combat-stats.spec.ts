import { describe, expect, it } from 'vitest'
import { aggregateCombatStats } from '~~/shared/utils/dnd/combat-stats'

const rows: CombatStatsRow[] = [
  { id: 'a', name: 'Elara', type: 'player' },
  { id: 'b', name: 'Bruenor', type: 'player' },
  { id: 'c', name: 'Goblin', type: 'monster' },
]

function event(
  rowId: string,
  type: CombatEventType,
  payload: CombatEventPayload,
  round = 1,
): CombatStatsEvent {
  return { rowId, round, type, payload: payload as unknown as Json }
}

function damage(
  rowId: string,
  amount: number,
  before: number,
  after: number,
): CombatStatsEvent {
  return event(rowId, 'hp', { kind: 'damage', amount, before, after })
}

function statsFor(events: CombatStatsEvent[], rounds = 3) {
  const result = aggregateCombatStats(events, rows, rounds)
  const byId = Object.fromEntries(result.combatants.map(c => [c.rowId, c]))

  return { result, byId }
}

describe('aggregateCombatStats', () => {
  it('returns a zeroed entry per row when there are no events', () => {
    const { result } = statsFor([])

    expect(result.events).toBe(0)
    expect(result.damageTaken).toBe(0)
    expect(result.combatants).toHaveLength(3)
    expect(result.combatants.every(c => c.award === 'unscathed')).toBe(true)
  })

  it('carries the round count through untouched', () => {
    expect(aggregateCombatStats([], rows, 7).rounds).toBe(7)
  })

  it('sums damage taken and tracks the biggest single hit', () => {
    const { byId } = statsFor([
      damage('a', 10, 20, 10),
      damage('a', 4, 10, 6),
      damage('a', 12, 6, -6),
    ])

    expect(byId.a?.damageTaken).toBe(26)
    expect(byId.a?.biggestHit).toBe(12)
  })

  it('counts a downing only when hit points cross from above zero', () => {
    const { byId } = statsFor([
      damage('a', 20, 20, 0),
      damage('a', 5, 0, -5),
      damage('a', 3, -5, -8),
    ])

    expect(byId.a?.timesDowned).toBe(1)
  })

  it('separates healing and temporary hit points from damage', () => {
    const { byId } = statsFor([
      event('a', 'hp', { kind: 'heal', amount: 8 }),
      event('a', 'hp', { kind: 'temp', amount: 5 }),
      event('a', 'hp', { kind: 'override', amount: 40 }),
    ])

    expect(byId.a?.healingReceived).toBe(8)
    expect(byId.a?.tempHitPointsGained).toBe(5)
    expect(byId.a?.damageTaken).toBe(0)
  })

  it('accumulates death saves by result', () => {
    const { byId, result } = statsFor([
      event('a', 'death_save', { result: 'fail', amount: 2 }),
      event('a', 'death_save', { result: 'save', amount: 1 }),
      event('b', 'death_save', { result: 'save', amount: 3 }),
    ])

    expect(byId.a?.deathSavesFailed).toBe(2)
    expect(byId.a?.deathSavesMade).toBe(1)
    expect(result.deathSavesMade).toBe(4)
    expect(result.deathSavesFailed).toBe(2)
  })

  it('counts conditions, concentration breaks and stabilizations', () => {
    const { byId, result } = statsFor([
      event('a', 'condition_added', { condition: { id: '1', name: 'Prone' } }),
      event('a', 'condition_added', { condition: { id: '2', name: 'Blind' } }),
      event('a', 'condition_removed', {
        condition: { id: '1', name: 'Prone' },
      }),
      event('a', 'concentration_broken', {}),
      event('a', 'stabilized', {}),
    ])

    expect(byId.a?.conditionsSuffered).toBe(2)
    expect(byId.a?.concentrationBroken).toBe(1)
    expect(byId.a?.stabilized).toBe(1)
    expect(result.conditionsApplied).toBe(2)
  })

  it('rolls per-combatant numbers up into the global totals', () => {
    const { result } = statsFor([
      damage('a', 10, 20, 10),
      damage('c', 20, 20, 0),
      event('b', 'hp', { kind: 'heal', amount: 6 }),
      event('c', 'died', {}),
    ])

    expect(result.damageTaken).toBe(30)
    expect(result.healingReceived).toBe(6)
    expect(result.timesDowned).toBe(1)
    expect(result.deaths).toBe(1)
    expect(result.events).toBe(4)
  })

  it('awards the fallen their own award regardless of other metrics', () => {
    const { byId } = statsFor([
      damage('c', 20, 20, 0),
      event('c', 'died', {}),
      damage('a', 3, 20, 17),
    ])

    expect(byId.c?.award).toBe('died')
    expect(byId.c?.awardValue).toBe(20)
  })

  it('gives each survivor a distinct award', () => {
    const { byId } = statsFor([
      damage('a', 22, 30, 8),
      event('b', 'hp', { kind: 'heal', amount: 14 }),
      damage('c', 4, 20, 16),
    ])

    const awards = [byId.a?.award, byId.b?.award, byId.c?.award]

    expect(new Set(awards).size).toBe(3)
    expect(byId.a?.award).toBe('mostDamageTaken')
    expect(byId.a?.awardValue).toBe(22)
  })

  it('breaks award ties by the earlier row', () => {
    const { byId } = statsFor([
      damage('a', 10, 20, 10),
      damage('b', 10, 20, 10),
    ])

    expect(byId.a?.award).toBe('mostDamageTaken')
    expect(byId.b?.award).not.toBe('mostDamageTaken')
  })

  it('falls back to a duplicate award when every metric is claimed', () => {
    const { byId } = statsFor([
      damage('a', 30, 40, 10),
      damage('b', 20, 40, 20),
      damage('c', 10, 40, 30),
    ])

    expect(byId.a?.award).toBe('mostDamageTaken')
    expect(byId.b?.award).toBe('biggestHit')
    expect(byId.c?.award).toBe('mostDamageTaken')
    expect(byId.c?.awardValue).toBe(10)
    expect(byId.c?.awardExclusive).toBe(false)
    expect(byId.a?.awardExclusive).toBe(true)
  })

  it('leaves untouched combatants unscathed', () => {
    const { byId } = statsFor([damage('a', 10, 20, 10)])

    expect(byId.b?.award).toBe('unscathed')
    expect(byId.b?.awardValue).toBe(0)
  })

  it('keeps events for rows no longer on the sheet', () => {
    const { result } = statsFor([
      event('gone', 'hp', {
        kind: 'damage',
        amount: 9,
        before: 10,
        after: 1,
        rowName: 'Dire Wolf',
      }),
    ])

    const orphan = result.combatants.find(c => c.rowId === 'gone')

    expect(orphan?.name).toBe('Dire Wolf')
    expect(orphan?.damageTaken).toBe(9)
    expect(result.damageTaken).toBe(9)
  })

  it('tolerates a null payload', () => {
    const { result } = statsFor([
      { rowId: 'a', round: 1, type: 'hp', payload: null },
    ])

    expect(result.damageTaken).toBe(0)
  })
})
