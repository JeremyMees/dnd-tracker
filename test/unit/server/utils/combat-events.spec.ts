import { describe, expect, it } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import {
  broadcastSheetAction,
  broadcastSheetDeleted,
  broadcastSheetSync,
  logCombatEvents,
} from '~~/server/utils/combat-events'

describe('combat-events', () => {
  describe('logCombatEvents', () => {
    it('inserts one row per event with the actor and encounter context', async () => {
      mockFrom({ combat_events: mockChain({ data: null, error: null }) })

      const supabase = serverSupabaseServiceRole({} as never)

      await logCombatEvents(supabase, {
        encounterId: 7,
        rowId: 'row-1',
        round: 2,
        actorId: 'user-1',
        actorName: 'Jeremy',
        events: [
          { type: 'hp', payload: { kind: 'damage', amount: 5 } },
          { type: 'concentration_broken', payload: {} },
        ],
      })

      expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
        {
          encounterId: 7,
          rowId: 'row-1',
          round: 2,
          type: 'hp',
          payload: { kind: 'damage', amount: 5 },
          createdBy: 'user-1',
          actorName: 'Jeremy',
        },
        {
          encounterId: 7,
          rowId: 'row-1',
          round: 2,
          type: 'concentration_broken',
          payload: {},
          createdBy: 'user-1',
          actorName: 'Jeremy',
        },
      ])
    })

    it('defaults the actor to null when not provided', async () => {
      mockFrom({ combat_events: mockChain({ data: null, error: null }) })

      const supabase = serverSupabaseServiceRole({} as never)

      await logCombatEvents(supabase, {
        encounterId: 7,
        rowId: 'row-1',
        round: 1,
        events: [{ type: 'died', payload: {} }],
      })

      expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
        {
          encounterId: 7,
          rowId: 'row-1',
          round: 1,
          type: 'died',
          payload: {},
          createdBy: null,
          actorName: null,
        },
      ])
    })

    it('does nothing when there are no events', async () => {
      const from = mockFrom({})
      const supabase = serverSupabaseServiceRole({} as never)

      await logCombatEvents(supabase, {
        encounterId: 7,
        rowId: 'row-1',
        round: 1,
        events: [],
      })

      expect(from).not.toHaveBeenCalled()
    })

    it('propagates a postgres error from the insert', async () => {
      mockFrom({
        combat_events: mockChain({
          data: null,
          error: { code: '23505', message: 'boom', details: '', hint: '' },
        }),
      })

      const supabase = serverSupabaseServiceRole({} as never)

      await expect(
        logCombatEvents(supabase, {
          encounterId: 7,
          rowId: 'row-1',
          round: 1,
          events: [{ type: 'died', payload: {} }],
        }),
      ).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  describe('broadcastSheetAction', () => {
    it('increments the sheet version and broadcasts the patch over the sheet channel', async () => {
      mockFrom({}, { rpc: mockChain({ data: 4, error: null }) })

      await broadcastSheetAction(serverSupabaseServiceRole({} as never), 7, {
        row: 'row-1',
        patch: { hitPoints: 10 },
      })

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.rpc).toHaveBeenCalledWith('increment_sheet_version', {
        p_encounter: 7,
      })
      expect(supabase.channel).toHaveBeenCalledWith('sheet:7')

      const channel = supabase.channel('sheet:7')

      expect(channel.httpSend).toHaveBeenCalledWith('action', {
        version: 4,
        row: 'row-1',
        patch: { hitPoints: 10 },
      })
    })
  })

  describe('broadcastSheetSync', () => {
    it('increments the sheet version and broadcasts the sheet over the sheet channel', async () => {
      mockFrom({}, { rpc: mockChain({ data: 9, error: null }) })

      await broadcastSheetSync(serverSupabaseServiceRole({} as never), 7, {
        round: 2,
      })

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.rpc).toHaveBeenCalledWith('increment_sheet_version', {
        p_encounter: 7,
      })

      const channel = supabase.channel('sheet:7')

      expect(channel.httpSend).toHaveBeenCalledWith('sync', {
        version: 9,
        sheet: { round: 2 },
      })
    })
  })

  describe('broadcastSheetDeleted', () => {
    it('broadcasts a deleted event over the sheet channel without bumping the version', async () => {
      mockFrom({})

      await broadcastSheetDeleted(serverSupabaseServiceRole({} as never), 7)

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.channel).toHaveBeenCalledWith('sheet:7')

      const channel = supabase.channel('sheet:7')

      expect(channel.httpSend).toHaveBeenCalledWith('deleted', {})
    })
  })
})
