import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import {
  broadcastLiveAction,
  broadcastLiveEnded,
  broadcastLiveSeats,
  buildAcPatch,
  buildHpPatch,
  liveActionSchema,
} from '~~/server/utils/live-broadcast'

function supabaseWithSheet(data: Record<string, unknown>) {
  mockFrom({ initiative_sheets: mockChain({ data, error: null }) })

  return serverSupabaseServiceRole({} as never)
}

describe('live-broadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('broadcastLiveAction', () => {
    it('increments the session version and broadcasts the patch over the session channel', async () => {
      mockFrom({}, { rpc: mockChain({ data: 4, error: null }) })

      await broadcastLiveAction(
        serverSupabaseServiceRole({} as never),
        'session-uuid',
        {
          row: 'row-1',
          patch: { hitPoints: 10 },
        },
      )

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.rpc).toHaveBeenCalledWith('increment_live_version', {
        p_session: 'session-uuid',
      })
      expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')

      const channel = supabase.channel('live:session-uuid')

      expect(channel.httpSend).toHaveBeenCalledWith('action', {
        version: 4,
        row: 'row-1',
        patch: { hitPoints: 10 },
      })
    })

    it('propagates a postgres error from increment_live_version', async () => {
      mockFrom(
        {},
        {
          rpc: mockChain({
            data: null,
            error: { code: '23505', message: 'boom', details: '', hint: '' },
          }),
        },
      )

      await expect(
        broadcastLiveAction(
          serverSupabaseServiceRole({} as never),
          'session-uuid',
          {
            row: 'row-1',
            patch: { hitPoints: 10 },
          },
        ),
      ).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  describe('broadcastLiveEnded', () => {
    it('broadcasts an ended event over the session channel', async () => {
      mockFrom({})

      await broadcastLiveEnded(
        serverSupabaseServiceRole({} as never),
        'session-uuid',
      )

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')

      const channel = supabase.channel('live:session-uuid')

      expect(channel.httpSend).toHaveBeenCalledWith('ended', {})
    })
  })

  describe('broadcastLiveSeats', () => {
    it('broadcasts a seats update over the session channel', async () => {
      mockFrom({})

      await broadcastLiveSeats(
        serverSupabaseServiceRole({} as never),
        'session-uuid',
        {
          type: 'kicked',
          seat: 'seat-1',
        },
      )

      const supabase = serverSupabaseServiceRole({} as never)

      expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')

      const channel = supabase.channel('live:session-uuid')

      expect(channel.httpSend).toHaveBeenCalledWith('seats', {
        type: 'kicked',
        seat: 'seat-1',
      })
    })
  })

  describe('liveActionSchema', () => {
    it('accepts a valid hp action', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'hp', hpType: 'heal', amount: 10 }),
      ).not.toThrow()
    })

    it('rejects a negative hp amount', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'hp', hpType: 'heal', amount: -1 }),
      ).toThrow()
    })

    it('rejects the DM-only override hp type', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'hp', hpType: 'override', amount: 1 }),
      ).toThrow()
    })

    it('accepts a valid ac action', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'ac', acType: 'add', amount: 5 }),
      ).not.toThrow()
    })

    it('rejects the DM-only override ac type', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'ac', acType: 'override', amount: 5 }),
      ).toThrow()
    })

    it('rejects an initiative action', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'initiative', value: 12 }),
      ).toThrow()
    })

    it('accepts a valid deathSaves action', () => {
      expect(() =>
        liveActionSchema.parse({
          type: 'deathSaves',
          value: { save: [true, false, false], fail: [false, false, false] },
        }),
      ).not.toThrow()
    })

    it('rejects a malformed deathSaves tuple', () => {
      expect(() =>
        liveActionSchema.parse({
          type: 'deathSaves',
          value: { save: [true, false], fail: [false, false, false] },
        }),
      ).toThrow()
    })

    it('accepts a valid concentration action', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'concentration', value: true }),
      ).not.toThrow()
    })

    it('accepts a valid conditions action', () => {
      expect(() =>
        liveActionSchema.parse({
          type: 'conditions',
          value: [{ id: 'blinded', name: 'Blinded', desc: 'desc' }],
        }),
      ).not.toThrow()
    })

    it('rejects a condition missing required fields', () => {
      expect(() =>
        liveActionSchema.parse({
          type: 'conditions',
          value: [{ id: 'blinded' }],
        }),
      ).toThrow()
    })

    it('rejects an unknown action type', () => {
      expect(() => liveActionSchema.parse({ type: 'teleport' })).toThrow()
    })

    it('accepts a valid endTurn action', () => {
      expect(() => liveActionSchema.parse({ type: 'endTurn' })).not.toThrow()
    })
  })

  describe('buildHpPatch', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 10,
      maxHitPoints: 100,
      tempHitPoints: 0,
      concentration: false,
    }

    it('heals hitPoints up to the max and leaves other fields untouched', async () => {
      const supabase = supabaseWithSheet({
        rows: [row],
        settings: { negative: false },
      })

      const patch = await buildHpPatch(supabase, 7, 'row-1', {
        type: 'hp',
        hpType: 'heal',
        amount: 15,
      })

      expect(patch).toEqual({
        hitPoints: 25,
        tempHitPoints: 0,
        deathSaves: undefined,
        concentration: false,
        conditions: [],
      })
    })

    it('clamps damage to zero when negative hp is not allowed', async () => {
      const supabase = supabaseWithSheet({
        rows: [{ ...row, hitPoints: 5, tempHitPoints: 0 }],
        settings: { negative: false },
      })

      const patch = await buildHpPatch(supabase, 7, 'row-1', {
        type: 'hp',
        hpType: 'damage',
        amount: 20,
      })

      expect(patch.hitPoints).toBe(0)
    })

    it('allows negative hp when the sheet setting permits it', async () => {
      const supabase = supabaseWithSheet({
        rows: [{ ...row, hitPoints: 5, tempHitPoints: 0 }],
        settings: { negative: true },
      })

      const patch = await buildHpPatch(supabase, 7, 'row-1', {
        type: 'hp',
        hpType: 'damage',
        amount: 20,
      })

      expect(patch.hitPoints).toBe(-15)
    })

    it('adds death save failures when damage keeps a downed creature at 0hp', async () => {
      const supabase = supabaseWithSheet({
        rows: [
          {
            ...row,
            hitPoints: 0,
            tempHitPoints: 0,
            deathSaves: {
              fail: [false, false, false],
              save: [false, false, false],
            },
          },
        ],
        settings: { negative: false },
      })

      const patch = await buildHpPatch(supabase, 7, 'row-1', {
        type: 'hp',
        hpType: 'damage',
        amount: 5,
      })

      expect(patch.deathSaves).toEqual({
        fail: [true, true, false],
        save: [false, false, false],
      })
    })

    it('sets temp hp', async () => {
      const supabase = supabaseWithSheet({
        rows: [row],
        settings: {},
      })

      const patch = await buildHpPatch(supabase, 7, 'row-1', {
        type: 'hp',
        hpType: 'temp',
        amount: 8,
      })

      expect(patch.tempHitPoints).toBe(8)
    })

    it('throws a 404 when the row does not exist on the encounter', async () => {
      const supabase = supabaseWithSheet({ rows: [], settings: {} })

      await expect(
        buildHpPatch(supabase, 7, 'missing-row', {
          type: 'hp',
          hpType: 'heal',
          amount: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Row not found',
      })
    })
  })

  describe('buildAcPatch', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      armorClass: 15,
      maxArmorClass: 18,
      tempArmorClass: 0,
    }

    it('adds armor class without exceeding the max', async () => {
      const supabase = supabaseWithSheet({ rows: [row] })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'add',
        amount: 10,
      })

      expect(patch).toEqual({ armorClass: 18, tempArmorClass: 0 })
    })

    it('removes armor class, spending temp AC first', async () => {
      const supabase = supabaseWithSheet({
        rows: [{ ...row, tempArmorClass: 3 }],
      })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'remove',
        amount: 5,
      })

      expect(patch).toEqual({ armorClass: 13, tempArmorClass: 0 })
    })

    it('sets temporary armor class', async () => {
      const supabase = supabaseWithSheet({ rows: [row] })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'temp',
        amount: 5,
      })

      expect(patch).toEqual({ armorClass: 15, tempArmorClass: 5 })
    })

    it('throws a 404 when the row does not exist on the encounter', async () => {
      const supabase = supabaseWithSheet({ rows: [] })

      await expect(
        buildAcPatch(supabase, 7, 'missing-row', {
          type: 'ac',
          acType: 'add',
          amount: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Row not found',
      })
    })
  })
})
