import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSheetSession } from '~/composables/useSheetSession'

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
const memory = memorySheetAdapter(sheet)
const adapter = {
  update: vi.fn(memory.update),
  patchRows: vi.fn(memory.patchRows),
  nextTurn: vi.fn(memory.nextTurn),
}

function hitPoints(): (number | undefined)[] {
  return sheet.value!.rows.map(item => item.hitPoints)
}

describe('useSheetSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sheet.value = {
      id: 1,
      title: 'Fight',
      round: 1,
      activeIndex: 0,
      rows: [
        row('a', { index: 0, hitPoints: 20 }),
        row('b', { index: 1, hitPoints: 8 }),
      ],
    } as InitiativeSheet
  })

  describe('commands', () => {
    it('patches one row', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })

      expect(adapter.patchRows).toHaveBeenCalledWith([
        { rowId: 'a', patch: { hitPoints: 5 } },
      ])
      expect(hitPoints()).toEqual([5, 8])
    })

    it('patches several rows in one write', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRows([
        { rowId: 'a', patch: { hitPoints: 5 } },
        { rowId: 'b', patch: { hitPoints: 0 } },
      ])

      expect(adapter.patchRows).toHaveBeenCalledTimes(1)
      expect(hitPoints()).toEqual([5, 0])
    })

    it('edits the rows as a whole', async () => {
      const session = useSheetSession(sheet, adapter)
      const rows = [...sheet.value!.rows, row('goblin')]

      await session.editRows(rows)

      expect(adapter.update).toHaveBeenCalledWith({ rows })
      expect(sheet.value!.rows.map(item => item.id)).toEqual([
        'a',
        'b',
        'goblin',
      ])
    })

    it('updates sheet fields without touching the rows', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.updateSheet({ info: 'Ambush at dawn' })

      expect(adapter.update).toHaveBeenCalledWith({ info: 'Ambush at dawn' })
      expect(sheet.value!.info).toBe('Ambush at dawn')
    })

    it('passes on the reminders of the next turn', async () => {
      const session = useSheetSession(sheet, adapter)

      expect(await session.nextTurn()).toEqual({
        expired: [],
        saves: [],
        recharges: [],
      })
      expect(sheet.value!.activeIndex).toBe(1)
    })
  })

  describe('undo', () => {
    it('has nothing to undo at the start', () => {
      const { canUndo } = useSheetSession(sheet, adapter)

      expect(canUndo.value).toBe(false)
    })

    it('undoes a patched row with a patch', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      adapter.patchRows.mockClear()
      await session.undo()

      expect(adapter.patchRows).toHaveBeenCalledWith([
        { rowId: 'a', patch: { hitPoints: 20 } },
      ])
      expect(adapter.update).not.toHaveBeenCalled()
      expect(hitPoints()).toEqual([20, 8])
      expect(session.canUndo.value).toBe(false)
    })

    it('undoes a batch of patched rows as one step', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRows([
        { rowId: 'a', patch: { hitPoints: 5 } },
        { rowId: 'b', patch: { hitPoints: 0 } },
      ])
      await session.undo()

      expect(hitPoints()).toEqual([20, 8])
      expect(session.canUndo.value).toBe(false)
    })

    it('undoes a field that was added by writing the rows', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { tempHitPoints: 4 })
      await session.undo()

      expect(adapter.update).toHaveBeenCalledTimes(1)
      expect(sheet.value!.rows[0]).not.toHaveProperty('tempHitPoints')
    })

    it('keeps changes made by others since', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      await memory.patchRows([{ rowId: 'b', patch: { hitPoints: 1 } }])
      await session.undo()

      expect(hitPoints()).toEqual([20, 1])
    })

    it('undoes added rows', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.editRows([...sheet.value!.rows, row('goblin')])
      await session.undo()

      expect(sheet.value!.rows.map(item => item.id)).toEqual(['a', 'b'])
    })

    it('undoes the next turn', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.nextTurn()
      await session.undo()

      expect(sheet.value!.activeIndex).toBe(0)
    })

    it('undoes the latest change first', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 15 })
      await session.patchRow('a', { hitPoints: 10 })
      await session.undo()

      expect(hitPoints()[0]).toBe(15)

      await session.undo()

      expect(hitPoints()[0]).toBe(20)
    })

    it('does not record changes that leave rows and turn alone', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.updateSheet({ info: 'Ambush at dawn' })

      expect(session.canUndo.value).toBe(false)
    })

    it('does not record a change that failed', async () => {
      const session = useSheetSession(sheet, adapter)

      adapter.patchRows.mockRejectedValueOnce(new Error('offline'))

      await expect(session.patchRow('a', { hitPoints: 5 })).rejects.toThrow()

      expect(session.canUndo.value).toBe(false)
    })

    it('keeps the change to undo when the undo fails', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })

      adapter.patchRows.mockRejectedValueOnce(new Error('offline'))

      expect(await session.undo()).toBe(false)
      expect(session.canUndo.value).toBe(true)
    })

    it('does not record the undo itself', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      await session.undo()

      expect(session.canUndo.value).toBe(false)
    })

    it('remembers at most 20 changes', async () => {
      const session = useSheetSession(sheet, adapter)

      for (let hp = 1; hp <= 21; hp++) {
        await session.patchRow('a', { hitPoints: hp })
      }

      let undone = 0

      while (await session.undo()) undone++

      expect(undone).toBe(20)
      expect(hitPoints()[0]).toBe(1)
    })
  })

  describe('redo', () => {
    it('has nothing to redo until something is undone', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })

      expect(session.canRedo.value).toBe(false)
      expect(await session.redo()).toBe(false)
    })

    it('redoes an undone change', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      await session.undo()

      expect(session.canRedo.value).toBe(true)

      await session.redo()

      expect(hitPoints()[0]).toBe(5)
      expect(session.canRedo.value).toBe(false)
      expect(session.canUndo.value).toBe(true)
    })

    it('keeps changes made by others since', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.editRows([...sheet.value!.rows, row('goblin')])
      await session.undo()
      await memory.patchRows([{ rowId: 'b', patch: { hitPoints: 1 } }])
      await session.redo()

      expect(sheet.value!.rows.map(item => item.id)).toEqual([
        'a',
        'b',
        'goblin',
      ])
      expect(hitPoints()[1]).toBe(1)
    })

    it('redoes several undone changes in order', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 15 })
      await session.patchRow('a', { hitPoints: 10 })
      await session.undo()
      await session.undo()
      await session.redo()

      expect(hitPoints()[0]).toBe(15)

      await session.redo()

      expect(hitPoints()[0]).toBe(10)
    })

    it('forgets what can be redone after a new change', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      await session.undo()
      await session.patchRow('b', { hitPoints: 2 })

      expect(session.canRedo.value).toBe(false)
    })

    it('keeps the change to redo when the redo fails', async () => {
      const session = useSheetSession(sheet, adapter)

      await session.patchRow('a', { hitPoints: 5 })
      await session.undo()

      adapter.patchRows.mockRejectedValueOnce(new Error('offline'))

      expect(await session.redo()).toBe(false)
      expect(session.canRedo.value).toBe(true)
    })
  })
})
