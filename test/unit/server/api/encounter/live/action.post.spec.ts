import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockStorage } from '~~/test/unit/stubs/storage'
import { signLiveSeatToken } from '~~/server/utils/live-token'
import handler from '~~/server/api/encounter/live/action.post'

const future = new Date(Date.now() + 60_000).toISOString()

const session = {
  seats: [
    { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
  ],
  expiresAt: future,
  endedAt: null,
}

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
}

function actionEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '1.2.3.4' },
  })
}

function seatToken(overrides: Partial<Record<string, unknown>> = {}) {
  return signLiveSeatToken(
    {
      session: 'session-uuid',
      encounter: 7,
      seat: 'seat-1',
      name: 'Elara',
      spectator: false,
      ...overrides,
    } as never,
    new Date(Date.now() + 60_000),
  )
}

describe('POST /api/encounter/live/action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
    mockStorage()
  })

  it("applies an hp action to the seat's claimed row", async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [row], settings: {} },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: mockChain({ data: { ...row, hitPoints: 15 }, error: null }),
      },
    )

    const result = await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'hp', hpType: 'heal', amount: 5 },
      }),
    )

    expect(result).toEqual({ row: { ...row, hitPoints: 15 } })
  })

  it('logs a combat event and broadcasts to the sheet channel for a heal action', async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, round: 3, rows: [row], settings: {} },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, hitPoints: 15 }, error: null }),
          mockChain({ data: 4, error: null }),
          mockChain({ data: 8, error: null }),
        ],
      },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'hp', hpType: 'heal', amount: 5 },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
      {
        encounterId: 7,
        rowId: 'row-1',
        round: 3,
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'heal',
          amount: 5,
          before: 10,
          after: 15,
        },
        createdBy: null,
        actorName: 'Elara',
      },
    ])

    expect(supabase.rpc).toHaveBeenCalledWith('increment_sheet_version', {
      p_encounter: 7,
    })

    const channel = supabase.channel('sheet:7')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 8,
      row: 'row-1',
      patch: {
        hitPoints: 15,
        tempHitPoints: undefined,
        deathSaves: undefined,
        concentration: undefined,
        conditions: [],
      },
    })
  })

  it('broadcasts a health band instead of raw hp for a player row hp action', async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [row], settings: {} },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, hitPoints: 7 }, error: null }),
          mockChain({ data: 4, error: null }),
          mockChain({ data: 8, error: null }),
        ],
      },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'hp', hpType: 'damage', amount: 3 },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 4,
      row: 'row-1',
      patch: {
        healthBand: 'bloodied',
        concentration: undefined,
        conditions: [],
      },
    })
  })

  it('broadcasts nothing for a player row death saves action', async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [row] },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, deathSaves: undefined }, error: null }),
          mockChain({ data: 5, error: null }),
          mockChain({ data: 9, error: null }),
        ],
      },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: {
          type: 'deathSaves',
          value: {
            save: [true, false, false],
            fail: [false, false, false],
          },
        },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 5,
      row: 'row-1',
      patch: {},
    })
  })

  it('broadcasts the raw hp patch for a non-player row', async () => {
    const token = await seatToken()
    const npcRow = { ...row, type: 'npc' as const }

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [npcRow], settings: {} },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...npcRow, hitPoints: 15 }, error: null }),
          mockChain({ data: 6, error: null }),
          mockChain({ data: 10, error: null }),
        ],
      },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'hp', hpType: 'heal', amount: 5 },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 6,
      row: 'row-1',
      patch: {
        hitPoints: 15,
        tempHitPoints: undefined,
        deathSaves: undefined,
        concentration: undefined,
        conditions: [],
      },
    })
  })

  it('forwards a direct field patch for non-hp/ac actions', async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [row] },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, concentration: true }, error: null }),
          mockChain({ data: 4, error: null }),
          mockChain({ data: 7, error: null }),
        ],
      },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'concentration', value: true },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { concentration: true },
    })
    expect(supabase.rpc).toHaveBeenCalledWith('increment_live_version', {
      p_session: 'session-uuid',
    })
    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')

    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 4,
      row: 'row-1',
      patch: { concentration: true },
    })
  })

  it("applies an ac action to the seat's claimed row", async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: {
            activeIndex: 0,
            rows: [
              { ...row, armorClass: 15, maxArmorClass: 18, tempArmorClass: 0 },
            ],
          },
          error: null,
        }),
        combat_events: mockChain({ data: null, error: null }),
      },
      { rpc: mockChain({ data: { ...row, armorClass: 18 }, error: null }) },
    )

    await handler(
      actionEvent({
        seatToken: token,
        action: { type: 'ac', acType: 'add', amount: 10 },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { armorClass: 18, tempArmorClass: 0 },
    })
  })

  it('advances to the next row and broadcasts a full sync for an endTurn action', async () => {
    const token = await seatToken()
    const otherRow = { ...row, id: 'row-2' }

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: [
          mockChain({
            data: {
              activeIndex: 0,
              round: 1,
              rows: [row, otherRow],
              settings: {},
            },
            error: null,
          }),
          mockChain({
            data: {
              id: 7,
              title: 'Ambush',
              round: 1,
              activeIndex: 1,
              rows: [row, otherRow],
              settings: {},
            },
            error: null,
          }),
        ],
      },
      { rpc: mockChain({ data: 9, error: null }) },
    )

    const result = await handler(
      actionEvent({ seatToken: token, action: { type: 'endTurn' } }),
    )

    expect(result).toEqual({ synced: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('increment_live_version', {
      p_session: 'session-uuid',
    })

    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith(
      'sync',
      expect.objectContaining({
        version: 9,
        sheet: expect.objectContaining({ round: 1, activeIndex: 1 }),
      }),
    )
  })

  it('wraps to the first row and increments the round when ending the last turn', async () => {
    const token = await seatToken()
    const otherRow = { ...row, id: 'row-2' }

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: [
          mockChain({
            data: {
              activeIndex: 1,
              round: 1,
              rows: [otherRow, row],
              settings: {},
            },
            error: null,
          }),
          mockChain({
            data: {
              id: 7,
              title: 'Ambush',
              round: 2,
              activeIndex: 0,
              rows: [otherRow, row],
              settings: {},
            },
            error: null,
          }),
        ],
      },
      { rpc: mockChain({ data: 1, error: null }) },
    )

    const result = await handler(
      actionEvent({ seatToken: token, action: { type: 'endTurn' } }),
    )

    expect(result).toEqual({ synced: true })

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith(
      'sync',
      expect.objectContaining({
        sheet: expect.objectContaining({ round: 2, activeIndex: 0 }),
      }),
    )
  })

  it('throws a 403 when the DM has disabled ending turns', async () => {
    const token = await seatToken()

    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({
        data: {
          activeIndex: 0,
          round: 1,
          rows: [row],
          settings: { live: { allow: { endTurn: false } } },
        },
        error: null,
      }),
    })

    await expect(
      handler(actionEvent({ seatToken: token, action: { type: 'endTurn' } })),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Action not allowed',
    })
  })

  it('throws a 403 when the seat is a spectator', async () => {
    const token = await seatToken({ seat: 'seat-2', spectator: true })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Spectators cannot act',
    })
  })

  it('throws a 404 when the live session no longer exists', async () => {
    const token = await seatToken()

    mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it('throws a 410 when the session has ended', async () => {
    const token = await seatToken()

    mockFrom({
      live_sessions: mockChain({
        data: { ...session, endedAt: new Date().toISOString() },
        error: null,
      }),
    })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 410 when the session has expired', async () => {
    const token = await seatToken()

    mockFrom({
      live_sessions: mockChain({
        data: {
          ...session,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
        error: null,
      }),
    })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 403 when the seat was kicked and no longer exists', async () => {
    const token = await seatToken({ seat: 'seat-missing' })

    mockFrom({ live_sessions: mockChain({ data: session, error: null }) })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'No row claimed',
    })
  })

  it('throws a 403 when the seat has no claimed row', async () => {
    const token = await seatToken({ seat: 'seat-2', spectator: false })

    mockFrom({ live_sessions: mockChain({ data: session, error: null }) })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'No row claimed',
    })
  })

  it("throws a 403 when it is not the seat's row's turn", async () => {
    const token = await seatToken()

    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({
        data: {
          activeIndex: 1,
          rows: [row, { ...row, id: 'row-2' }],
        },
        error: null,
      }),
    })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Not your turn',
    })
  })

  it('throws a 403 when the DM has disabled this action type', async () => {
    const token = await seatToken()

    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({
        data: {
          activeIndex: 0,
          rows: [row],
          settings: { live: { allow: { concentration: false } } },
        },
        error: null,
      }),
    })

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Action not allowed',
    })
  })

  it('propagates a postgres error from apply_live_action', async () => {
    const token = await seatToken()

    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({
          data: { activeIndex: 0, rows: [row] },
          error: null,
        }),
      },
      {
        rpc: mockChain({
          data: null,
          error: {
            code: 'P0002',
            message: 'row missing',
            details: '',
            hint: '',
          },
        }),
      },
    )

    await expect(
      handler(
        actionEvent({
          seatToken: token,
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws a validation error for an unknown action type', async () => {
    const token = await seatToken()

    await expect(
      handler(actionEvent({ seatToken: token, action: { type: 'teleport' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('throws a 401 for an invalid seat token', async () => {
    await expect(
      handler(
        actionEvent({
          seatToken: 'not-a-jwt',
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid live session token',
    })
  })

  it('throws a 429 after too many action attempts from the same IP', async () => {
    for (let i = 0; i < 60; i++) {
      await expect(
        handler(
          actionEvent({
            seatToken: 'not-a-jwt',
            action: { type: 'concentration', value: true },
          }),
        ),
      ).rejects.toMatchObject({ statusCode: 401 })
    }

    await expect(
      handler(
        actionEvent({
          seatToken: 'not-a-jwt',
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })
})
