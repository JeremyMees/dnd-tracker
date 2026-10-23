import { describe, expect, it } from 'vitest'
import {
  memorySheetContext,
  storedSheet,
} from '~~/test/unit/stubs/sheet-changes'
import {
  applyRowPatches,
  sendLiveState,
  sendSheetSync,
} from '~~/server/utils/sheet-changes'

const elara: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
}

const goblin: InitiativeSheetRow = {
  ...elara,
  id: 'row-2',
  index: 1,
  name: 'Goblin',
  type: 'monster',
}

const sheet = storedSheet({ round: 2, rows: [elara, goblin] })

const liveSession: SheetLiveSession = {
  uuid: 'session-uuid',
  seats: [{ seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false }],
}

describe('sheet-changes', () => {
  describe('applyRowPatches', () => {
    it('stores the patch, logs the change and sends it to the sheet', async () => {
      const { ctx, state } = memorySheetContext(sheet)

      const rows = await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { hitPoints: 6 } },
      ])

      expect(rows).toEqual([{ ...elara, hitPoints: 6 }])
      expect(state.sheet.rows).toEqual([{ ...elara, hitPoints: 6 }, goblin])
      expect(state.events).toEqual([
        {
          encounterId: 7,
          rowId: 'row-1',
          round: 2,
          type: 'hp',
          payload: {
            rowName: 'Elara',
            kind: 'damage',
            amount: 4,
            before: 10,
            after: 6,
          },
          createdBy: 'user-1',
          actorName: null,
        },
      ])
      expect(state.messages).toEqual([
        {
          topic: 'sheet:7',
          event: 'action',
          payload: { version: 1, row: 'row-1', patch: { hitPoints: 6 } },
        },
      ])
    })

    it('credits a named actor in the log', async () => {
      const { ctx, state } = memorySheetContext(sheet, {
        actor: { name: 'Elara' },
      })

      await applyRowPatches(ctx, [{ rowId: 'row-1', patch: { readied: true } }])

      expect(state.events).toEqual([
        expect.objectContaining({
          type: 'readied',
          createdBy: null,
          actorName: 'Elara',
        }),
      ])
    })

    it('sends the new player view to an active live session', async () => {
      const { ctx, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { name: 'Elara Moonwhisper' } },
      ])

      expect(sent('live:session-uuid')).toEqual([
        {
          topic: 'live:session-uuid',
          event: 'sync',
          payload: {
            version: 1,
            sheet: toPlayerSheet({
              ...sheet,
              rows: [{ ...elara, name: 'Elara Moonwhisper' }, goblin],
            }),
          },
        },
      ])
    })

    it('masks a row for the players once it is hidden', async () => {
      const { ctx, state, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [{ rowId: 'row-2', patch: { hidden: true } }])

      expect(state.events).toEqual([
        expect.objectContaining({
          type: 'hidden',
          rowId: 'row-2',
          payload: { rowName: 'Goblin' },
        }),
      ])
      expect(sent('live:session-uuid')[0]?.payload.sheet).toMatchObject({
        rows: [
          expect.objectContaining({ id: 'row-1', name: 'Elara' }),
          expect.objectContaining({ id: 'row-2', name: '???', hidden: true }),
        ],
      })
    })

    it('leaves the live session alone for a note-only patch', async () => {
      const { ctx, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { note: 'Flanking' } },
      ])

      expect(sent('sheet:7')).toHaveLength(1)
      expect(sent('live:session-uuid')).toEqual([])
    })

    it('refuses to hide a row a player has claimed', async () => {
      const { ctx, state } = memorySheetContext(sheet, { liveSession })

      await expect(
        applyRowPatches(ctx, [{ rowId: 'row-1', patch: { hidden: true } }]),
      ).rejects.toMatchObject({ statusCode: 409, statusMessage: 'row-claimed' })

      expect(state.sheet.rows).toEqual(sheet.rows)
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
    })

    it('still reveals a claimed row', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ rows: [{ ...elara, hidden: true }] }),
        { liveSession },
      )

      await applyRowPatches(ctx, [{ rowId: 'row-1', patch: { hidden: false } }])

      expect(state.sheet.rows).toEqual([{ ...elara, hidden: false }])
    })

    it('throws a 404 and writes nothing when a row is not on the sheet', async () => {
      const { ctx, state } = memorySheetContext(sheet)

      await expect(
        applyRowPatches(ctx, [
          { rowId: 'row-1', patch: { hitPoints: 6 } },
          { rowId: 'missing', patch: { hitPoints: 6 } },
        ]),
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Row not found',
      })

      expect(state.sheet.rows).toEqual(sheet.rows)
      expect(state.messages).toEqual([])
    })

    it('patches several rows, logs each change and sends one sync per topic', async () => {
      const { ctx, state, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { hitPoints: 4 } },
        { rowId: 'row-2', patch: { hitPoints: 8 } },
      ])

      const after = [
        { ...elara, hitPoints: 4 },
        { ...goblin, hitPoints: 8 },
      ]

      expect(state.sheet.rows).toEqual(after)
      expect(state.events.map(({ rowId, type }) => ({ rowId, type }))).toEqual([
        { rowId: 'row-1', type: 'hp' },
        { rowId: 'row-2', type: 'hp' },
      ])
      expect(sent('sheet:7')).toEqual([
        {
          topic: 'sheet:7',
          event: 'sync',
          payload: { version: 1, sheet: { ...sheet, rows: after } },
        },
      ])
      expect(sent('live:session-uuid')).toHaveLength(1)
    })

    it('diffs against the sheet it is given instead of reading it again', async () => {
      const { ctx, state } = memorySheetContext(sheet)

      await applyRowPatches(
        ctx,
        [{ rowId: 'row-1', patch: { hitPoints: 6 } }],
        { ...sheet, round: 5, rows: [{ ...elara, hitPoints: 12 }, goblin] },
      )

      expect(state.events).toEqual([
        expect.objectContaining({
          round: 5,
          payload: expect.objectContaining({ before: 12, after: 6 }),
        }),
      ])
    })

    it('stores a cleared override as null, as jsonb keeps it', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ rows: [{ ...elara, maxHitPointsOld: 15 }] }),
      )

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { maxHitPointsOld: null } },
      ])

      expect(state.sheet.rows[0]?.maxHitPointsOld).toBeNull()
    })
  })

  describe('sendSheetSync', () => {
    it('sends the stored sheet with the next version and the reminders', async () => {
      const { ctx, sent } = memorySheetContext(sheet)
      const reminders: TurnReminders = { expired: [], saves: [], recharges: [] }

      await sendSheetSync(ctx)
      await sendSheetSync(ctx, reminders)

      expect(sent('sheet:7')).toEqual([
        { topic: 'sheet:7', event: 'sync', payload: { version: 1, sheet } },
        {
          topic: 'sheet:7',
          event: 'sync',
          payload: { version: 2, sheet, reminders },
        },
      ])
    })
  })

  describe('sendLiveState', () => {
    it('sends the player view of the stored sheet to the session', async () => {
      const { ctx, sent } = memorySheetContext(sheet)

      await sendLiveState(ctx, 'session-uuid')

      expect(sent('live:session-uuid')).toEqual([
        {
          topic: 'live:session-uuid',
          event: 'sync',
          payload: { version: 1, sheet: toPlayerSheet(sheet) },
        },
      ])
    })
  })
})
