import { describe, expect, it } from 'vitest'
import {
  diffFlags,
  diffRow,
  diffSheet,
  isStatEvent,
  turnEvent,
} from '~~/shared/utils/dnd/combat-events'

const baseRow: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 20,
  maxHitPoints: 20,
  tempHitPoints: 0,
  armorClass: 15,
  maxArmorClass: 20,
  tempArmorClass: 0,
  concentration: false,
  deathSaves: {
    fail: [false, false, false],
    save: [false, false, false],
  },
}

describe('diffRow', () => {
  it('returns no events when nothing changed', () => {
    expect(diffRow(baseRow, { ...baseRow })).toEqual([])
  })

  it('reports a heal when hitPoints increases', () => {
    const after = { ...baseRow, hitPoints: 10 }

    expect(diffRow({ ...baseRow, hitPoints: 5 }, after)).toEqual([
      {
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'heal',
          amount: 5,
          before: 5,
          after: 10,
        },
      },
    ])
  })

  it('reports damage when hitPoints decreases', () => {
    const result = diffRow(baseRow, { ...baseRow, hitPoints: 12 })

    expect(result).toEqual([
      {
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'damage',
          amount: 8,
          before: 20,
          after: 12,
        },
      },
    ])
  })

  it('reports an hp override when maxHitPoints also changes', () => {
    const result = diffRow(baseRow, {
      ...baseRow,
      hitPoints: 30,
      maxHitPoints: 30,
    })

    expect(result).toEqual([
      {
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'override',
          amount: 10,
          before: 20,
          after: 30,
        },
      },
    ])
  })

  it('reports temp hp when only tempHitPoints changes', () => {
    const result = diffRow(baseRow, { ...baseRow, tempHitPoints: 5 })

    expect(result).toEqual([
      {
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'temp',
          amount: 5,
          before: 0,
          after: 5,
        },
      },
    ])
  })

  it('reports armor class added and removed', () => {
    expect(diffRow(baseRow, { ...baseRow, armorClass: 18 })).toEqual([
      {
        type: 'ac',
        payload: {
          rowName: 'Elara',
          kind: 'add',
          amount: 3,
          before: 15,
          after: 18,
        },
      },
    ])

    expect(diffRow(baseRow, { ...baseRow, armorClass: 10 })).toEqual([
      {
        type: 'ac',
        payload: {
          rowName: 'Elara',
          kind: 'remove',
          amount: 5,
          before: 15,
          after: 10,
        },
      },
    ])
  })

  it('reports an ac override when maxArmorClass also changes', () => {
    const result = diffRow(baseRow, {
      ...baseRow,
      armorClass: 25,
      maxArmorClass: 25,
    })

    expect(result).toEqual([
      {
        type: 'ac',
        payload: {
          rowName: 'Elara',
          kind: 'override',
          amount: 10,
          before: 15,
          after: 25,
        },
      },
    ])
  })

  it('reports temp ac when only tempArmorClass changes', () => {
    const result = diffRow(baseRow, { ...baseRow, tempArmorClass: 4 })

    expect(result).toEqual([
      {
        type: 'ac',
        payload: {
          rowName: 'Elara',
          kind: 'temp',
          amount: 4,
          before: 0,
          after: 4,
        },
      },
    ])
  })

  it('reports added and removed conditions', () => {
    const blinded = { id: 'blinded', name: 'Blinded', desc: 'desc' }

    expect(diffRow(baseRow, { ...baseRow, conditions: [blinded] })).toEqual([
      {
        type: 'condition_added',
        payload: {
          rowName: 'Elara',
          condition: { id: 'blinded', name: 'Blinded' },
        },
      },
    ])

    expect(diffRow({ ...baseRow, conditions: [blinded] }, baseRow)).toEqual([
      {
        type: 'condition_removed',
        payload: {
          rowName: 'Elara',
          condition: { id: 'blinded', name: 'Blinded' },
        },
      },
    ])
  })

  it('reports a broken concentration when it flips from true to false', () => {
    const result = diffRow(
      { ...baseRow, concentration: true },
      { ...baseRow, concentration: false },
    )

    expect(result).toEqual([
      { type: 'concentration_broken', payload: { rowName: 'Elara' } },
    ])
  })

  it('reports a started concentration when it flips from false to true', () => {
    const result = diffRow(
      { ...baseRow, concentration: false },
      { ...baseRow, concentration: true },
    )

    expect(result).toEqual([
      { type: 'concentration_started', payload: { rowName: 'Elara' } },
    ])
  })

  it('reports no concentration event when it stays unchanged', () => {
    const result = diffRow(
      { ...baseRow, concentration: true },
      { ...baseRow, concentration: true },
    )

    expect(result).toEqual([])
  })

  it('reports newly added death save failures', () => {
    const after = {
      ...baseRow,
      deathSaves: { fail: [true, true, false], save: [false, false, false] },
    } as InitiativeSheetRow

    const result = diffRow(baseRow, after)

    expect(result).toEqual([
      {
        type: 'death_save',
        payload: { rowName: 'Elara', result: 'fail', amount: 2 },
      },
    ])
  })

  it('reports a death when the third death save failure lands', () => {
    const before = {
      ...baseRow,
      deathSaves: { fail: [true, true, false], save: [false, false, false] },
    } as InitiativeSheetRow
    const after = {
      ...baseRow,
      deathSaves: { fail: [true, true, true], save: [false, false, false] },
    } as InitiativeSheetRow

    const result = diffRow(before, after)

    expect(result).toEqual([
      {
        type: 'death_save',
        payload: { rowName: 'Elara', result: 'fail', amount: 1 },
      },
      { type: 'died', payload: { rowName: 'Elara' } },
    ])
  })

  it('reports stabilization when the third death save success lands', () => {
    const before = {
      ...baseRow,
      deathSaves: { fail: [false, false, false], save: [true, true, false] },
    } as InitiativeSheetRow
    const after = {
      ...baseRow,
      deathSaves: { fail: [false, false, false], save: [true, true, true] },
    } as InitiativeSheetRow

    const result = diffRow(before, after)

    expect(result).toEqual([
      {
        type: 'death_save',
        payload: { rowName: 'Elara', result: 'save', amount: 1 },
      },
      { type: 'stabilized', payload: { rowName: 'Elara' } },
    ])
  })
})

describe('isStatEvent', () => {
  it.each(['turn', 'row_added', 'row_removed', 'roll', 'hidden', 'revealed'])(
    'leaves %s events out of the stats',
    type => {
      expect(isStatEvent({ type })).toBe(false)
    },
  )

  it.each(['hp', 'condition_added', 'died'])('counts %s events', type => {
    expect(isStatEvent({ type })).toBe(true)
  })
})

describe('turnEvent', () => {
  it('names the row whose turn it is', () => {
    expect(turnEvent([baseRow], 0)).toEqual({
      type: 'turn',
      rowId: 'row-1',
      payload: { rowName: 'Elara' },
    })
  })

  it('returns nothing when there is no row at the index', () => {
    expect(turnEvent([baseRow], 3)).toBeUndefined()
  })
})

describe('diffSheet', () => {
  const goblin: InitiativeSheetRow = {
    ...baseRow,
    id: 'row-2',
    index: 1,
    name: 'Goblin',
    type: 'monster',
    initiative: 0,
  }
  const sheet = { rows: [baseRow, goblin], activeIndex: 0, round: 1 }

  it('returns no events when the rows and turn did not change', () => {
    expect(
      diffSheet(sheet, { rows: [{ ...baseRow, hitPoints: 3 }, goblin] }),
    ).toEqual([])
  })

  it('logs an added row with its initiative', () => {
    const wolf = { ...goblin, id: 'row-3', name: 'Wolf', initiative: 14 }

    expect(diffSheet(sheet, { rows: [...sheet.rows, wolf] })).toEqual([
      {
        type: 'row_added',
        rowId: 'row-3',
        payload: { rowName: 'Wolf', initiative: 14 },
      },
    ])
  })

  it('leaves the initiative out when the added row has not rolled', () => {
    const wolf = { ...goblin, id: 'row-3', name: 'Wolf', initiative: -1 }

    expect(diffSheet(sheet, { rows: [...sheet.rows, wolf] })).toEqual([
      {
        type: 'row_added',
        rowId: 'row-3',
        payload: { rowName: 'Wolf', initiative: undefined },
      },
    ])
  })

  it('logs a removed row', () => {
    expect(diffSheet(sheet, { rows: [baseRow] })).toEqual([
      { type: 'row_removed', rowId: 'row-2', payload: { rowName: 'Goblin' } },
    ])
  })

  it('logs the turn when the active index changes', () => {
    expect(diffSheet({ ...sheet, activeIndex: 1 }, { activeIndex: 0 })).toEqual(
      [{ type: 'turn', rowId: 'row-1', payload: { rowName: 'Elara' } }],
    )
  })

  it('logs the turn when only the round changes', () => {
    expect(
      diffSheet({ ...sheet, round: 2 }, { activeIndex: 0, round: 1 }),
    ).toEqual([{ type: 'turn', rowId: 'row-1', payload: { rowName: 'Elara' } }])
  })

  it('names the active row from the new rows', () => {
    expect(
      diffSheet(sheet, { rows: [goblin, baseRow], activeIndex: 1 }),
    ).toEqual([{ type: 'turn', rowId: 'row-1', payload: { rowName: 'Elara' } }])
  })
})

describe('diffFlags', () => {
  it.each([
    [{}, { readied: true }, 'readied'],
    [{ readied: true }, { readied: false }, 'ready_used'],
    [{}, { hidden: true }, 'hidden'],
    [{ hidden: true }, { hidden: false }, 'revealed'],
  ])('logs %o → %o as %s', (before, after, type) => {
    expect(
      diffFlags({ ...baseRow, ...before }, { ...baseRow, ...after }),
    ).toEqual([{ type, payload: { rowName: 'Elara' } }])
  })

  it('logs nothing when a reset drops the flag', () => {
    expect(diffFlags({ ...baseRow, readied: true }, baseRow)).toEqual([])
    expect(diffFlags({ ...baseRow, hidden: true }, baseRow)).toEqual([])
  })

  it('is part of the row diff', () => {
    expect(diffRow(baseRow, { ...baseRow, readied: true })).toEqual([
      { type: 'readied', payload: { rowName: 'Elara' } },
    ])
  })

  it('logs a ready and a hide on the same change', () => {
    expect(
      diffFlags(baseRow, { ...baseRow, readied: true, hidden: true }),
    ).toEqual([
      { type: 'readied', payload: { rowName: 'Elara' } },
      { type: 'hidden', payload: { rowName: 'Elara' } },
    ])
  })

  it('is part of the sheet diff with the row id', () => {
    const sheet = {
      rows: [{ ...baseRow, readied: true }],
      activeIndex: 0,
      round: 1,
    }

    expect(
      diffSheet(sheet, { rows: [{ ...baseRow, readied: false }] }),
    ).toEqual([
      { type: 'ready_used', rowId: 'row-1', payload: { rowName: 'Elara' } },
    ])
  })

  it('logs a reveal in the sheet diff with the row id', () => {
    const sheet = {
      rows: [{ ...baseRow, hidden: true }],
      activeIndex: 0,
      round: 1,
    }

    expect(diffSheet(sheet, { rows: [{ ...baseRow, hidden: false }] })).toEqual(
      [{ type: 'revealed', rowId: 'row-1', payload: { rowName: 'Elara' } }],
    )
  })
})
