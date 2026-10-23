import { describe, expect, it } from 'vitest'
import '~~/test/unit/stubs/supabase'
import {
  memorySheetContext,
  storedSheet,
} from '~~/test/unit/stubs/sheet-changes'
import {
  advanceSheetTurn,
  applyRowPatches,
  sendLiveState,
  sendSheetSync,
  applySheetUpdate,
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

    it('numbers each patch in the order it was written', async () => {
      const { ctx, state, sent } = memorySheetContext(sheet)
      const write = ctx.store.patchRows
      let release = () => {}
      const held = new Promise<void>(resolve => {
        release = resolve
      })
      let writes = 0

      ctx.store = {
        ...ctx.store,
        async patchRows(...args) {
          const written = await write(...args)

          if (writes++ === 0) await held

          return written
        },
      }

      const first = applyRowPatches(ctx, [
        { rowId: 'row-2', patch: { hitPoints: 6 } },
      ])

      await applyRowPatches(ctx, [{ rowId: 'row-2', patch: { hitPoints: 2 } }])
      release()
      await first

      const [latest] = sent('sheet:7')
        .map(({ payload }) => payload as { version: number; patch: object })
        .sort((a, b) => b.version - a.version)

      expect(state.sheet.rows[1]?.hitPoints).toBe(2)
      expect(latest?.patch).toEqual({ hitPoints: 2 })
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

    it('sends the changed row as the players see it to an active live session', async () => {
      const { ctx, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { name: 'Elara Moonwhisper' } },
      ])

      expect(sent('live:session-uuid')).toEqual([
        {
          topic: 'live:session-uuid',
          event: 'action',
          payload: {
            version: 1,
            row: toPlayerSheet({
              ...sheet,
              rows: [{ ...elara, name: 'Elara Moonwhisper' }, goblin],
            }).rows[0],
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
      expect(sent('live:session-uuid')[0]?.payload.row).toMatchObject({
        id: 'row-2',
        name: '???',
        hidden: true,
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

    it('patches several rows, logs each change and sends one sync per topic when several rows look different', async () => {
      const { ctx, state, sent } = memorySheetContext(sheet, { liveSession })

      await applyRowPatches(ctx, [
        { rowId: 'row-1', patch: { hitPoints: 4 } },
        { rowId: 'row-2', patch: { hitPoints: 1 } },
      ])

      const after = [
        { ...elara, hitPoints: 4 },
        { ...goblin, hitPoints: 1 },
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
          payload: { version: 2, sheet: { ...sheet, rows: after } },
        },
      ])
      expect(sent('live:session-uuid')).toEqual([
        expect.objectContaining({ event: 'sync' }),
      ])
    })

    it('diffs against the sheet it is given instead of reading it again', async () => {
      const { ctx, state } = memorySheetContext(sheet)

      await applyRowPatches(
        ctx,
        [{ rowId: 'row-1', patch: { hitPoints: 6 } }],
        {
          before: {
            ...sheet,
            round: 5,
            rows: [{ ...elara, hitPoints: 12 }, goblin],
          },
        },
      )

      expect(state.events).toEqual([
        expect.objectContaining({
          round: 5,
          payload: expect.objectContaining({ before: 12, after: 6 }),
        }),
      ])
    })

    describe('from a player seat', () => {
      const seat: SheetSeatOrigin = { session: 'seat-session' }

      it('sends what the other players may see as a live action', async () => {
        const { ctx, sent } = memorySheetContext(sheet, {
          actor: { name: 'Elara' },
        })

        await applyRowPatches(
          ctx,
          [{ rowId: 'row-1', patch: { hitPoints: 7 } }],
          {
            seat,
          },
        )

        expect(sent('live:seat-session')).toEqual([
          {
            topic: 'live:seat-session',
            event: 'action',
            payload: {
              version: 1,
              row: toPlayerSheet({
                ...sheet,
                rows: [{ ...elara, hitPoints: 7 }, goblin],
              }).rows[0],
            },
          },
        ])
        expect(sent('sheet:7')).toEqual([
          {
            topic: 'sheet:7',
            event: 'action',
            payload: { version: 1, row: 'row-1', patch: { hitPoints: 7 } },
          },
        ])
      })

      it('sends a monster row as the players see it', async () => {
        const { ctx, sent } = memorySheetContext(sheet)

        await applyRowPatches(
          ctx,
          [{ rowId: 'row-2', patch: { hitPoints: 3 } }],
          {
            seat,
          },
        )

        expect(sent('live:seat-session')[0]?.payload.row).toEqual(
          expect.objectContaining({ id: 'row-2', healthBand: 'critical' }),
        )
        expect(sent('live:seat-session')[0]?.payload.row).not.toHaveProperty(
          'hitPoints',
        )
      })

      it('skips the full player view sync of the session it came from', async () => {
        const { ctx, sent } = memorySheetContext(sheet, { liveSession })

        await applyRowPatches(
          ctx,
          [{ rowId: 'row-1', patch: { hitPoints: 7 } }],
          {
            seat,
          },
        )

        expect(sent('live:session-uuid')).toEqual([])
      })
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

  describe('advanceSheetTurn', () => {
    const prone: DndCondition = {
      id: 'prone',
      name: 'Prone',
      desc: 'On the ground.',
      duration: { rowId: 'row-2', timing: 'end', rounds: 1 },
    }

    const proneGoblin: InitiativeSheetRow = { ...goblin, conditions: [prone] }

    it('moves to the next row and logs whose turn it is', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ rows: [elara, goblin] }),
        { actor: { id: 'user-1', name: 'Elara' } },
      )

      const result = await advanceSheetTurn(ctx)

      expect(state.sheet).toMatchObject({ activeIndex: 1, round: 1 })
      expect(result).toEqual({
        sheet: expect.objectContaining({ activeIndex: 1, round: 1 }),
        expired: [],
        saves: [],
        recharges: [],
      })
      expect(state.events).toEqual([
        {
          encounterId: 7,
          rowId: 'row-2',
          round: 1,
          type: 'turn',
          payload: { rowName: 'Goblin' },
          createdBy: 'user-1',
          actorName: 'Elara',
        },
      ])
    })

    it('wraps to the first row in the next round', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ activeIndex: 1, round: 2, rows: [elara, goblin] }),
      )

      await advanceSheetTurn(ctx)

      expect(state.sheet).toMatchObject({ activeIndex: 0, round: 3 })
      expect(state.events).toEqual([
        expect.objectContaining({ type: 'turn', rowId: 'row-1', round: 3 }),
      ])
    })

    it('expires a timed condition, logs it and returns the reminder', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ activeIndex: 1, rows: [elara, proneGoblin] }),
      )

      const result = await advanceSheetTurn(ctx)

      expect(state.sheet.rows).toEqual([elara, goblin])
      expect(state.events).toEqual([
        expect.objectContaining({ type: 'turn', rowId: 'row-1' }),
        expect.objectContaining({
          type: 'condition_expired',
          rowId: 'row-2',
          payload: {
            rowName: 'Goblin',
            condition: { id: 'prone', name: 'Prone' },
          },
        }),
      ])
      expect(result.expired).toEqual([
        { rowId: 'row-2', rowName: 'Goblin', condition: prone },
      ])
    })

    it('logs a readied action that ran out when its row starts its turn', async () => {
      const { ctx, state } = memorySheetContext(
        storedSheet({ rows: [elara, { ...goblin, readied: true }] }),
      )

      await advanceSheetTurn(ctx)

      expect(state.sheet.rows[1]?.readied).toBe(false)
      expect(state.events).toEqual([
        expect.objectContaining({ type: 'turn', rowId: 'row-2' }),
        expect.objectContaining({
          type: 'ready_expired',
          rowId: 'row-2',
          payload: { rowName: 'Goblin' },
        }),
      ])
    })

    it('syncs the sheet and the active live session', async () => {
      const { ctx, state, sent } = memorySheetContext(
        storedSheet({ rows: [elara, goblin] }),
        { liveSession },
      )

      await advanceSheetTurn(ctx)

      expect(sent('sheet:7')).toEqual([
        {
          topic: 'sheet:7',
          event: 'sync',
          payload: { version: 1, sheet: state.sheet },
        },
      ])
      expect(sent('live:session-uuid')).toEqual([
        {
          topic: 'live:session-uuid',
          event: 'sync',
          payload: { version: 1, sheet: toPlayerSheet(state.sheet) },
        },
      ])
    })

    it('sends the reminders to the sheet when asked to', async () => {
      const { ctx, sent } = memorySheetContext(
        storedSheet({ activeIndex: 1, rows: [elara, proneGoblin] }),
      )

      await advanceSheetTurn(ctx, { sendReminders: true })

      expect(sent('sheet:7')[0]?.payload.reminders).toEqual({
        expired: [{ rowId: 'row-2', rowName: 'Goblin', condition: prone }],
        saves: [],
        recharges: [],
      })
    })

    it('syncs the given live session instead of looking one up', async () => {
      const { ctx, sent } = memorySheetContext(
        storedSheet({ rows: [elara, goblin] }),
        { liveSession },
      )

      await advanceSheetTurn(ctx, { session: 'seat-session' })

      expect(sent('live:seat-session')).toHaveLength(1)
      expect(sent('live:session-uuid')).toEqual([])
    })

    it('rejects with a 409 and logs nothing when another request already advanced the turn', async () => {
      const stored = storedSheet({ rows: [elara, goblin] })
      const { ctx, state } = memorySheetContext({ ...stored, activeIndex: 1 })

      await expect(
        advanceSheetTurn(ctx, { before: stored }),
      ).rejects.toMatchObject({ statusCode: 409 })

      expect(state.sheet.activeIndex).toBe(1)
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
    })
  })

  describe('applySheetUpdate', () => {
    it('stores the update, logs what changed and syncs the sheet', async () => {
      const { ctx, state, sent } = memorySheetContext(sheet)

      await applySheetUpdate(ctx, { rows: [elara], activeIndex: 0 })

      expect(state.sheet.rows).toEqual([elara])
      expect(state.events).toEqual([
        {
          encounterId: 7,
          rowId: 'row-2',
          round: 2,
          type: 'row_removed',
          payload: { rowName: 'Goblin' },
          createdBy: 'user-1',
          actorName: null,
        },
      ])
      expect(sent('sheet:7')).toEqual([
        {
          topic: 'sheet:7',
          event: 'sync',
          payload: { version: 1, sheet: state.sheet },
        },
      ])
    })

    describe('rows edited from an older copy of the sheet', () => {
      const player = { ...elara, hitPoints: 4 }
      const latest = storedSheet({ round: 2, rows: [player, goblin] })

      it('keeps a change a player made since', async () => {
        const { ctx, state } = memorySheetContext(latest)

        await applySheetUpdate(ctx, {
          baseRows: [elara, goblin],
          rows: [elara, { ...goblin, name: 'Goblin boss' }],
        })

        expect(state.sheet.rows).toEqual([
          player,
          { ...goblin, name: 'Goblin boss' },
        ])
      })

      it('still applies a field the edit changed', async () => {
        const { ctx, state } = memorySheetContext(latest)

        await applySheetUpdate(ctx, {
          baseRows: [elara, goblin],
          rows: [{ ...elara, hitPoints: 20 }, goblin],
        })

        expect(state.sheet.rows[0]?.hitPoints).toBe(20)
      })

      it('adds and removes the rows the edit added and removed', async () => {
        const orc = { ...goblin, id: 'row-3', index: 2, name: 'Orc' }
        const { ctx, state } = memorySheetContext(latest)

        await applySheetUpdate(ctx, {
          baseRows: [elara, goblin],
          rows: [elara, orc],
        })

        expect(state.sheet.rows).toEqual([player, { ...orc, index: 1 }])
      })

      it('only logs what the edit changed', async () => {
        const { ctx, state } = memorySheetContext(latest)

        await applySheetUpdate(ctx, {
          baseRows: [elara, goblin],
          rows: [elara],
        })

        expect(state.events.map(event => event.type)).toEqual(['row_removed'])
      })

      it('does not store the rows it was edited from', async () => {
        const { ctx, state } = memorySheetContext(latest)

        await applySheetUpdate(ctx, {
          baseRows: [elara, goblin],
          rows: [elara, goblin],
        })

        expect(state.sheet).not.toHaveProperty('baseRows')
      })
    })

    it('reindexes the rows by initiative and cleans their numbers and conditions', async () => {
      const { ctx, state } = memorySheetContext(storedSheet())

      await applySheetUpdate(ctx, {
        rows: [
          { ...elara, initiative: 5, index: 0, hitPoints: 7.6 },
          {
            ...goblin,
            initiative: 15,
            index: 1,
            conditions: [{ id: 'prone', name: 'Prone', desc: 'Down.' }],
          },
        ],
      })

      expect(state.sheet.rows).toEqual([
        {
          ...goblin,
          initiative: 15,
          index: 0,
          conditions: [{ id: 'prone', name: 'Prone', desc: '' }],
        },
        { ...elara, initiative: 5, index: 1, hitPoints: 8 },
      ])
    })

    it('logs a turn change with the new round', async () => {
      const { ctx, state } = memorySheetContext(sheet)

      await applySheetUpdate(ctx, { activeIndex: 1, round: 3 })

      expect(state.events).toEqual([
        expect.objectContaining({ type: 'turn', rowId: 'row-2', round: 3 }),
      ])
    })

    it.each([
      [{ rows: [elara, goblin] }],
      [{ round: 3 }],
      [{ activeIndex: 1 }],
      [{ settings: { spacing: 'compact', modified: true } }],
    ] as InitiativeSheetUpdate[][])(
      'sends the player view to the live session for %o',
      async update => {
        const { ctx, sent } = memorySheetContext(sheet, { liveSession })

        await applySheetUpdate(ctx, update)

        expect(sent('live:session-uuid')).toHaveLength(1)
      },
    )

    it.each([
      [{ info: 'Ambush at dawn' }],
      [{ infoCards: [] }],
    ] as InitiativeSheetUpdate[][])(
      'leaves the live session alone for %o',
      async update => {
        const { ctx, sent } = memorySheetContext(sheet, { liveSession })

        await applySheetUpdate(ctx, update)

        expect(sent('sheet:7')).toHaveLength(1)
        expect(sent('live:session-uuid')).toEqual([])
      },
    )

    it('refuses to hide a row a player has claimed', async () => {
      const { ctx, state } = memorySheetContext(sheet, { liveSession })

      await expect(
        applySheetUpdate(ctx, { rows: [{ ...elara, hidden: true }, goblin] }),
      ).rejects.toMatchObject({ statusCode: 409, statusMessage: 'row-claimed' })

      expect(state.sheet.rows).toEqual(sheet.rows)
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
    })

    it('refuses rows that take the encounter past 50', async () => {
      const { ctx, state } = memorySheetContext(sheet)
      const rows = Array.from({ length: 51 }, (_, index) => ({
        ...goblin,
        id: `row-${index}`,
      }))

      await expect(applySheetUpdate(ctx, { rows })).rejects.toMatchObject({
        statusCode: 422,
        statusMessage: 'encounter-full',
      })

      expect(state.sheet.rows).toEqual(sheet.rows)
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
    })

    it('still edits an encounter that was already past 50', async () => {
      const crowded = Array.from({ length: 55 }, (_, index) => ({
        ...goblin,
        id: `row-${index}`,
        index,
      }))
      const { ctx, state } = memorySheetContext(storedSheet({ rows: crowded }))

      await applySheetUpdate(ctx, { rows: crowded.slice(1) })

      expect(state.sheet.rows).toHaveLength(54)
    })

    it('keeps a claimed row that was already hidden hidden', async () => {
      const hidden = { ...elara, hidden: true }
      const { ctx, state } = memorySheetContext(
        storedSheet({ rows: [hidden, goblin] }),
        { liveSession },
      )

      await applySheetUpdate(ctx, {
        rows: [hidden, { ...goblin, hidden: true }],
      })

      expect(state.sheet.rows).toEqual([hidden, { ...goblin, hidden: true }])
    })

    it('hides a row nobody claimed', async () => {
      const { ctx, state } = memorySheetContext(sheet, { liveSession })

      await applySheetUpdate(ctx, {
        rows: [elara, { ...goblin, hidden: true }],
      })

      expect(state.sheet.rows[1]?.hidden).toBe(true)
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
