import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUndoHistory } from '~/composables/useUndoHistory'

function row(
  id: string,
  fields: Partial<InitiativeSheetRow> = {},
): InitiativeSheetRow {
  return {
    id,
    name: id,
    index: 0,
    initiative: 10,
    type: 'monster',
    conditions: [],
    ...fields,
  }
}

const sheet = ref<InitiativeSheet | undefined>()

const actions = {
  update: vi.fn(async (payload: UpdateInitiativeSheetData) => {
    sheet.value = { ...sheet.value!, ...payload }
  }),
  patchRow: vi.fn(async (rowId: string, patch: Partial<InitiativeSheetRow>) => {
    sheet.value = {
      ...sheet.value!,
      rows: sheet.value!.rows.map(r =>
        r.id === rowId ? { ...r, ...patch } : r,
      ),
    }
  }),
  nextTurn: vi.fn(async (): Promise<TurnReminders | undefined> => {
    sheet.value = { ...sheet.value!, activeIndex: 1 }

    return { expired: [], saves: [], recharges: [] }
  }),
}

describe('useUndoHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sheet.value = {
      id: 1,
      title: 'Fight',
      round: 1,
      activeIndex: 0,
      rows: [row('a', { hitPoints: 20 }), row('b', { hitPoints: 8 })],
    } as InitiativeSheet
  })

  it('has nothing to undo at the start', () => {
    const { canUndo } = useUndoHistory(sheet, actions)

    expect(canUndo.value).toBe(false)
  })

  it('undoes a patched row', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })

    expect(history.canUndo.value).toBe(true)

    await history.undo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(20)
    expect(history.canUndo.value).toBe(false)
  })

  it('keeps changes made by others since when undoing', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })
    await actions.patchRow('b', { hitPoints: 1 })
    await history.undo()

    expect(sheet.value!.rows.map(r => r.hitPoints)).toEqual([20, 1])
  })

  it('undoes added rows from an update', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.update({ rows: [...sheet.value!.rows, row('goblin')] })
    await history.undo()

    expect(sheet.value!.rows.map(r => r.id)).toEqual(['a', 'b'])
  })

  it('undoes the next turn', async () => {
    const history = useUndoHistory(sheet, actions)

    const reminders = await history.nextTurn()

    expect(reminders).toEqual({ expired: [], saves: [], recharges: [] })

    await history.undo()

    expect(sheet.value!.activeIndex).toBe(0)
  })

  it('undoes the latest change first', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 15 })
    await history.patchRow('a', { hitPoints: 10 })
    await history.undo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(15)

    await history.undo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(20)
  })

  it('does not record updates that leave rows and turn alone', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.update({ title: 'Renamed' })

    expect(history.canUndo.value).toBe(false)
  })

  it('does not record a change that failed', async () => {
    const history = useUndoHistory(sheet, actions)

    actions.patchRow.mockRejectedValueOnce(new Error('offline'))

    await expect(history.patchRow('a', { hitPoints: 5 })).rejects.toThrow()

    expect(history.canUndo.value).toBe(false)
  })

  it('keeps the change to undo when the undo fails', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })

    actions.update.mockRejectedValueOnce(new Error('offline'))

    expect(await history.undo()).toBe(false)
    expect(history.canUndo.value).toBe(true)
  })

  it('does not record the undo itself', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })
    await history.undo()

    expect(history.canUndo.value).toBe(false)
  })

  it('has nothing to redo until something is undone', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })

    expect(history.canRedo.value).toBe(false)
    expect(await history.redo()).toBe(false)
  })

  it('redoes an undone change', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })
    await history.undo()

    expect(history.canRedo.value).toBe(true)

    await history.redo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(5)
    expect(history.canRedo.value).toBe(false)
    expect(history.canUndo.value).toBe(true)
  })

  it('keeps changes made by others since when redoing', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.update({ rows: [...sheet.value!.rows, row('goblin')] })
    await history.undo()
    await actions.patchRow('b', { hitPoints: 1 })
    await history.redo()

    expect(sheet.value!.rows.map(r => r.id)).toEqual(['a', 'b', 'goblin'])
    expect(sheet.value!.rows[1]!.hitPoints).toBe(1)
  })

  it('redoes several undone changes in order', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 15 })
    await history.patchRow('a', { hitPoints: 10 })
    await history.undo()
    await history.undo()
    await history.redo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(15)

    await history.redo()

    expect(sheet.value!.rows[0]!.hitPoints).toBe(10)
  })

  it('forgets what can be redone after a new change', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })
    await history.undo()
    await history.patchRow('b', { hitPoints: 2 })

    expect(history.canRedo.value).toBe(false)
  })

  it('keeps the change to redo when the redo fails', async () => {
    const history = useUndoHistory(sheet, actions)

    await history.patchRow('a', { hitPoints: 5 })
    await history.undo()

    actions.update.mockRejectedValueOnce(new Error('offline'))

    expect(await history.redo()).toBe(false)
    expect(history.canRedo.value).toBe(true)
  })

  it('remembers at most 20 changes', async () => {
    const history = useUndoHistory(sheet, actions)

    for (let hp = 1; hp <= 21; hp++) {
      await history.patchRow('a', { hitPoints: hp })
    }

    let undone = 0

    while (await history.undo()) undone++

    expect(undone).toBe(20)
    expect(sheet.value!.rows[0]!.hitPoints).toBe(1)
  })
})
