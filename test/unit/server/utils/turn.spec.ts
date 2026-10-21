import { describe, expect, it } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import { toPlayerSheet } from '~~/server/utils/player-portal'
import { advanceEncounterTurn } from '~~/server/utils/turn'

const prone: DndCondition = {
  id: 'prone',
  name: 'Prone',
  desc: 'On the ground.',
  duration: { rowId: 'row-1', timing: 'end', rounds: 1 },
}

const rowOne: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 15,
  name: 'Goblin',
  type: 'monster',
  conditions: [prone],
}

const rowTwo: InitiativeSheetRow = {
  id: 'row-2',
  index: 1,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
}

function updatedSheet(rows: InitiativeSheetRow[]): TurnSheet {
  return {
    id: 7,
    title: 'Ambush',
    round: 1,
    activeIndex: 1,
    rows,
    settings: { spacing: 'normal', modified: false },
  }
}

function mockDatabase({
  updated,
  session = null,
}: {
  updated: ReturnType<typeof updatedSheet> | null
  session?: { uuid: string } | null
}) {
  mockFrom(
    {
      initiative_sheets: mockChain({ data: updated, error: null }),
      combat_events: mockChain({ data: null, error: null }),
      live_sessions: mockChain({ data: session, error: null }),
    },
    { rpc: mockChain({ data: 4, error: null }) },
  )

  return serverSupabaseServiceRole({} as never)
}

describe('turn', () => {
  describe('advanceEncounterTurn', () => {
    it('advances only when the turn is still the one that was read', async () => {
      const supabase = mockDatabase({
        updated: updatedSheet([{ ...rowOne, conditions: [] }, rowTwo]),
      })

      await advanceEncounterTurn(
        supabase,
        7,
        { activeIndex: 0, round: 1, rows: [rowOne, rowTwo] },
        { actorId: 'user-1' },
      )

      const sheets = supabase.from('initiative_sheets')

      expect(sheets.update).toHaveBeenCalledWith({
        activeIndex: 1,
        round: 1,
        rows: [{ ...rowOne, conditions: [] }, rowTwo],
      })
      expect(sheets.eq).toHaveBeenCalledWith('id', 7)
      expect(sheets.eq).toHaveBeenCalledWith('activeIndex', 0)
      expect(sheets.eq).toHaveBeenCalledWith('round', 1)
    })

    it('leaves the rows out of the update when no duration changed', async () => {
      const supabase = mockDatabase({ updated: updatedSheet([rowTwo, rowTwo]) })

      await advanceEncounterTurn(supabase, 7, {
        activeIndex: 0,
        round: 1,
        rows: [rowTwo, { ...rowTwo, id: 'row-3' }],
      })

      expect(supabase.from('initiative_sheets').update).toHaveBeenCalledWith({
        activeIndex: 1,
        round: 1,
      })
    })

    it('logs whose turn it is now', async () => {
      const supabase = mockDatabase({ updated: updatedSheet([rowTwo, rowTwo]) })

      await advanceEncounterTurn(
        supabase,
        7,
        {
          activeIndex: 0,
          round: 1,
          rows: [rowTwo, { ...rowTwo, id: 'row-3' }],
        },
        { actorId: 'user-1', actorName: 'Elara' },
      )

      expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
        {
          encounterId: 7,
          rowId: 'row-3',
          round: 1,
          type: 'turn',
          payload: { rowName: 'Elara' },
          createdBy: 'user-1',
          actorName: 'Elara',
        },
      ])
    })

    it('logs an expired condition and returns the reminders', async () => {
      const updated = updatedSheet([{ ...rowOne, conditions: [] }, rowTwo])
      const supabase = mockDatabase({ updated })

      const result = await advanceEncounterTurn(
        supabase,
        7,
        { activeIndex: 0, round: 1, rows: [rowOne, rowTwo] },
        { actorId: 'user-1', actorName: null },
      )

      expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
        {
          encounterId: 7,
          rowId: 'row-2',
          round: 1,
          type: 'turn',
          payload: { rowName: 'Elara' },
          createdBy: 'user-1',
          actorName: null,
        },
        {
          encounterId: 7,
          rowId: 'row-1',
          round: 1,
          type: 'condition_expired',
          payload: {
            rowName: 'Goblin',
            condition: { id: 'prone', name: 'Prone' },
          },
          createdBy: 'user-1',
          actorName: null,
        },
      ])
      expect(result).toEqual({
        sheet: updated,
        expired: [{ rowId: 'row-1', rowName: 'Goblin', condition: prone }],
        saves: [],
        recharges: [],
      })
    })

    it('broadcasts the new turn to the sheet channel', async () => {
      const updated = updatedSheet([rowTwo, rowTwo])
      const supabase = mockDatabase({ updated })

      await advanceEncounterTurn(supabase, 7, {
        activeIndex: 0,
        round: 1,
        rows: [rowTwo, rowTwo],
      })

      expect(supabase.channel).toHaveBeenCalledWith('sheet:7')
      expect(supabase.channel('sheet:7').httpSend).toHaveBeenCalledWith(
        'sync',
        { version: 4, sheet: updated },
      )
      expect(supabase.channel).not.toHaveBeenCalledWith(
        expect.stringMatching(/^live:/),
      )
    })

    it('adds the reminders to the sheet broadcast when asked to', async () => {
      const updated = updatedSheet([{ ...rowOne, conditions: [] }, rowTwo])
      const supabase = mockDatabase({ updated })

      await advanceEncounterTurn(
        supabase,
        7,
        { activeIndex: 0, round: 1, rows: [rowOne, rowTwo] },
        { broadcastReminders: true },
      )

      expect(supabase.channel('sheet:7').httpSend).toHaveBeenCalledWith(
        'sync',
        {
          version: 4,
          sheet: updated,
          reminders: {
            expired: [{ rowId: 'row-1', rowName: 'Goblin', condition: prone }],
            saves: [],
            recharges: [],
          },
        },
      )
    })

    it('pushes the new turn to an active live session', async () => {
      const updated = updatedSheet([rowTwo, rowTwo])
      const supabase = mockDatabase({
        updated,
        session: { uuid: 'session-uuid' },
      })

      await advanceEncounterTurn(supabase, 7, {
        activeIndex: 0,
        round: 1,
        rows: [rowTwo, rowTwo],
      })

      expect(
        supabase.channel('live:session-uuid').httpSend,
      ).toHaveBeenCalledWith('sync', {
        version: 4,
        sheet: toPlayerSheet(updated),
      })
    })

    it('uses the given live session without looking it up', async () => {
      const supabase = mockDatabase({ updated: updatedSheet([rowTwo, rowTwo]) })

      await advanceEncounterTurn(
        supabase,
        7,
        { activeIndex: 0, round: 1, rows: [rowTwo, rowTwo] },
        { session: 'seat-session' },
      )

      expect(supabase.from).not.toHaveBeenCalledWith('live_sessions')
      expect(supabase.channel).toHaveBeenCalledWith('live:seat-session')
    })

    it('rejects with a 409 when another request already advanced the turn', async () => {
      const supabase = mockDatabase({ updated: null })

      await expect(
        advanceEncounterTurn(supabase, 7, {
          activeIndex: 0,
          round: 1,
          rows: [rowOne, rowTwo],
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
      expect(supabase.from('combat_events').insert).not.toHaveBeenCalled()
    })

    it('rejects when the update fails', async () => {
      mockFrom({
        initiative_sheets: mockChain({
          data: null,
          error: { code: '23514', message: 'check violation' },
        }),
      })

      await expect(
        advanceEncounterTurn(serverSupabaseServiceRole({} as never), 7, {
          activeIndex: 0,
          round: 1,
          rows: [rowOne, rowTwo],
        }),
      ).rejects.toBeTruthy()
    })
  })
})
