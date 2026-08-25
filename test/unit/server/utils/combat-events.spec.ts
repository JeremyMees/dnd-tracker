import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import {
  broadcastSheetAction,
  broadcastSheetDeleted,
  broadcastSheetSync,
  diffRow,
  logCombatEvents,
} from '~~/server/utils/combat-events'

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

describe('combat-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
