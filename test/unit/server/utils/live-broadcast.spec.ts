import { describe, expect, it } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import {
  activeLiveSession,
  broadcastLiveAction,
  broadcastLiveEnded,
  broadcastLiveSeats,
  buildAcPatch,
  buildHpPatch,
  buildLiveActionPatch,
  liveActionSchema,
  sanitizeBroadcastPatch,
} from '~~/server/utils/live-broadcast'
import { storedBloodiedCondition } from '~~/test/fixtures/bloodied-condition'

function supabaseWithSheet(data: Record<string, unknown>) {
  mockFrom({
    initiative_sheets: mockChain({ data, error: null }),
    srd_conditions: mockChain({ data: null, error: null }),
  })

  return serverSupabaseServiceRole({} as never)
}

describe('live-broadcast', () => {
  describe('activeLiveSession', () => {
    it('returns the uuid of the open, unexpired session for the encounter', async () => {
      const chain = mockChain({ data: { uuid: 'session-uuid' }, error: null })

      mockFrom({ live_sessions: chain })

      await expect(
        activeLiveSession(serverSupabaseServiceRole({} as never), 7),
      ).resolves.toBe('session-uuid')

      expect(chain.eq).toHaveBeenCalledWith('encounter', 7)
      expect(chain.is).toHaveBeenCalledWith('endedAt', null)
      expect(chain.gt).toHaveBeenCalledWith('expiresAt', expect.any(String))
    })

    it('returns undefined when the encounter has no live session', async () => {
      mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

      await expect(
        activeLiveSession(serverSupabaseServiceRole({} as never), 7),
      ).resolves.toBeUndefined()
    })
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

  describe('sanitizeBroadcastPatch', () => {
    const prone = { id: 'prone', name: 'Prone', desc: '' }
    const conditions = [prone, storedBloodiedCondition]
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions,
      hitPoints: 40,
      maxHitPoints: 100,
    }

    it('sends a player hp change as a health band without bloodied', () => {
      expect(
        sanitizeBroadcastPatch(row, 'hp', {
          hitPoints: 40,
          concentration: false,
          conditions,
        }),
      ).toEqual({
        healthBand: 'bloodied',
        concentration: false,
        conditions: [prone],
      })
    })

    it('drops bloodied from a player conditions change', () => {
      expect(sanitizeBroadcastPatch(row, 'conditions', { conditions })).toEqual(
        { conditions: [prone] },
      )
    })

    it('sends nothing for a player death saves change', () => {
      expect(
        sanitizeBroadcastPatch(row, 'deathSaves', {
          deathSaves: {
            fail: [true, false, false],
            save: [false, false, false],
          },
        }),
      ).toEqual({})
    })

    it('sends only the reaction for a reaction change', () => {
      expect(
        sanitizeBroadcastPatch({ ...row, type: 'npc' }, 'reaction', {
          resources: { reaction: true, legendaryResistances: 1 },
        }),
      ).toEqual({ reaction: true })
    })

    it('sends the readied flag when an action is readied', () => {
      expect(
        sanitizeBroadcastPatch({ ...row, type: 'npc' }, 'ready', {
          readied: true,
        }),
      ).toEqual({ readied: true })
    })

    it('sends the spent reaction when a readied action is used', () => {
      expect(
        sanitizeBroadcastPatch(row, 'ready', {
          readied: false,
          resources: { reaction: true, legendaryResistances: 1 },
        }),
      ).toEqual({ readied: false, reaction: true })
    })

    it('passes a non-player patch through untouched', () => {
      const patch = { hitPoints: 40, conditions }

      expect(sanitizeBroadcastPatch({ ...row, type: 'npc' }, 'hp', patch)).toBe(
        patch,
      )
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

    it('accepts a valid reaction action', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'reaction', value: true }),
      ).not.toThrow()
    })

    it('rejects a reaction action without a boolean value', () => {
      expect(() =>
        liveActionSchema.parse({ type: 'reaction', value: 1 }),
      ).toThrow()
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

    it('adds the stored bloodied condition when damage drops the row to half hp', async () => {
      const chain = mockChain({
        data: {
          id: 'bloodied',
          name: 'Bloodied',
          desc: 'At half hit points or fewer.',
          level: null,
          hasLevels: null,
        },
        error: null,
      })

      mockFrom({
        initiative_sheets: mockChain({
          data: { rows: [{ ...row, hitPoints: 80 }], settings: {} },
          error: null,
        }),
        srd_conditions: chain,
      })

      const patch = await buildHpPatch(
        serverSupabaseServiceRole({} as never),
        7,
        'row-1',
        { type: 'hp', hpType: 'damage', amount: 40 },
      )

      expect(chain.eq).toHaveBeenCalledWith('id', 'bloodied')
      expect(patch.conditions).toEqual([
        {
          id: 'bloodied',
          name: 'Bloodied',
          desc: 'At half hit points or fewer.',
        },
      ])
    })

    it('removes bloodied when a heal lifts the row above half hp', async () => {
      const bloodied = { id: 'bloodied', name: 'Bloodied', desc: '' }

      mockFrom({
        initiative_sheets: mockChain({
          data: {
            rows: [{ ...row, hitPoints: 40, conditions: [bloodied] }],
            settings: {},
          },
          error: null,
        }),
        srd_conditions: mockChain({ data: bloodied, error: null }),
      })

      const patch = await buildHpPatch(
        serverSupabaseServiceRole({} as never),
        7,
        'row-1',
        { type: 'hp', hpType: 'heal', amount: 20 },
      )

      expect(patch.conditions).toEqual([])
    })

    it('skips the bloodied lookup when the sheet has it switched off', async () => {
      const from = mockFrom({
        initiative_sheets: mockChain({
          data: { rows: [row], settings: { bloodied: false } },
          error: null,
        }),
      })

      const patch = await buildHpPatch(
        serverSupabaseServiceRole({} as never),
        7,
        'row-1',
        { type: 'hp', hpType: 'damage', amount: 5 },
      )

      expect(from).not.toHaveBeenCalledWith('srd_conditions')
      expect(patch.conditions).toEqual([])
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
        fail: [true, false, false],
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

    it('clamps armor class at zero when negative values are not allowed', async () => {
      const supabase = supabaseWithSheet({
        rows: [row],
        settings: { negative: false },
      })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'remove',
        amount: 20,
      })

      expect(patch).toEqual({ armorClass: 0, tempArmorClass: 0 })
    })

    it('clamps armor class at zero when the setting is missing', async () => {
      const supabase = supabaseWithSheet({ rows: [row], settings: {} })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'remove',
        amount: 20,
      })

      expect(patch.armorClass).toBe(0)
    })

    it('keeps negative armor class when the encounter allows it', async () => {
      const supabase = supabaseWithSheet({
        rows: [row],
        settings: { negative: true },
      })

      const patch = await buildAcPatch(supabase, 7, 'row-1', {
        type: 'ac',
        acType: 'remove',
        amount: 20,
      })

      expect(patch.armorClass).toBe(-5)
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

  describe('buildLiveActionPatch', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 20,
      maxHitPoints: 30,
      armorClass: 15,
      maxArmorClass: 18,
      tempArmorClass: 0,
      resources: { reaction: true },
    }

    it('builds an hp patch from the stored row', async () => {
      const supabase = supabaseWithSheet({
        rows: [row],
        settings: { negative: false },
      })

      const patch = await buildLiveActionPatch(supabase, 7, row, {
        type: 'hp',
        hpType: 'heal',
        amount: 5,
      })

      expect(patch).toMatchObject({ hitPoints: 25 })
    })

    it('builds an ac patch from the stored row', async () => {
      const supabase = supabaseWithSheet({ rows: [row] })

      const patch = await buildLiveActionPatch(supabase, 7, row, {
        type: 'ac',
        acType: 'add',
        amount: 1,
      })

      expect(patch).toEqual({ armorClass: 16, tempArmorClass: 0 })
    })

    it.each([
      [true, true],
      [false, undefined],
    ])(
      'sets the reaction to %s while keeping other resources',
      async (value, reaction) => {
        const patch = await buildLiveActionPatch(
          serverSupabaseServiceRole({} as never),
          7,
          { ...row, resources: { reaction: false, legendaryActions: 2 } },
          { type: 'reaction', value },
        )

        expect(patch).toEqual({
          resources: { reaction, legendaryActions: 2 },
        })
      },
    )

    it('readies an action', async () => {
      const patch = await buildLiveActionPatch(
        serverSupabaseServiceRole({} as never),
        7,
        row,
        { type: 'ready', value: true },
      )

      expect(patch).toEqual({ readied: true })
    })

    it('restores the reaction when a readied action is dropped', async () => {
      const patch = await buildLiveActionPatch(
        serverSupabaseServiceRole({} as never),
        7,
        { ...row, resources: { reaction: false } },
        { type: 'ready', value: false },
      )

      expect(patch).toEqual({ readied: false, resources: { reaction: true } })
    })

    it('passes other actions through as a single field', async () => {
      const patch = await buildLiveActionPatch(
        serverSupabaseServiceRole({} as never),
        7,
        row,
        { type: 'concentration', value: true },
      )

      expect(patch).toEqual({ concentration: true })
    })
  })
})
