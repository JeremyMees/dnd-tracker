import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockStorage } from '~~/test/unit/stubs/storage'
import {
  verifyLiveSeatToken,
  verifyLiveSessionToken,
} from '~~/server/utils/live-token'
import handler from '~~/server/api/live/join.post'

const future = new Date(Date.now() + 60_000).toISOString()

const session = {
  uuid: 'session-uuid',
  code: 'ABC234',
  encounter: 7,
  expiresAt: future,
  endedAt: null,
}

const sheet = {
  rows: [
    { id: 'row-1', type: 'player' },
    { id: 'row-2', type: 'npc' },
    { id: 'row-3', type: 'monster' },
  ],
}

function joinEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '1.2.3.4' },
  })
}

describe('POST /api/live/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
    mockStorage()
  })

  it('claims a row and issues session + seat tokens', async () => {
    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({ data: sheet, error: null }),
      },
      {
        rpc: mockChain({
          data: {
            seat: 'seat-1',
            row: 'row-1',
            name: 'Elara',
            spectator: false,
          },
          error: null,
        }),
      },
    )

    const result = (await handler(
      joinEvent({ code: 'abc234', name: 'Elara', row: 'row-1' }),
    )) as Record<string, unknown>

    expect(result).toMatchObject({
      seat: 'seat-1',
      row: 'row-1',
      spectator: false,
      code: 'ABC234',
      expiresAt: future,
    })

    await expect(
      verifyLiveSessionToken(result.sessionToken as string),
    ).resolves.toMatchObject({ session: 'session-uuid', encounter: 7 })
    await expect(
      verifyLiveSeatToken(result.seatToken as string),
    ).resolves.toMatchObject({
      session: 'session-uuid',
      encounter: 7,
      seat: 'seat-1',
      name: 'Elara',
      spectator: false,
    })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'seats',
      {
        type: 'joined',
        seat: { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
      },
    )
  })

  it('joins as a spectator without a row', async () => {
    mockFrom(
      { live_sessions: mockChain({ data: session, error: null }) },
      {
        rpc: mockChain({
          data: { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
          error: null,
        }),
      },
    )

    const result = await handler(
      joinEvent({ code: 'ABC234', name: 'Watcher', spectator: true }),
    )

    expect(result).toMatchObject({ seat: 'seat-2', row: null, spectator: true })
  })

  it('throws a 404 when the room code does not exist', async () => {
    mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

    await expect(
      handler(joinEvent({ code: 'ZZZZZZ', name: 'Elara', row: 'row-1' })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it('throws a 410 when the session has ended', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: { ...session, endedAt: new Date().toISOString() },
        error: null,
      }),
    })

    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara', row: 'row-1' })),
    ).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 404 when the row does not belong to the encounter', async () => {
    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara', row: 'missing' })),
    ).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Row not found' })
  })

  it('throws a 404 when the row is a monster (not player or npc)', async () => {
    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara', row: 'row-3' })),
    ).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Row not found' })
  })

  it('allows claiming an npc row', async () => {
    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({ data: sheet, error: null }),
      },
      {
        rpc: mockChain({
          data: {
            seat: 'seat-3',
            row: 'row-2',
            name: 'Ally',
            spectator: false,
          },
          error: null,
        }),
      },
    )

    const result = await handler(
      joinEvent({ code: 'ABC234', name: 'Ally', row: 'row-2' }),
    )

    expect(result).toMatchObject({ seat: 'seat-3', row: 'row-2' })
  })

  it('throws a 409 when the session is full', async () => {
    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({ data: sheet, error: null }),
      },
      {
        rpc: mockChain({
          data: null,
          error: { code: 'P0001', message: 'full', details: '', hint: '' },
        }),
      },
    )

    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara', row: 'row-1' })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Live session is full',
    })
  })

  it('throws a 409 when the row is already claimed', async () => {
    mockFrom(
      {
        live_sessions: mockChain({ data: session, error: null }),
        initiative_sheets: mockChain({ data: sheet, error: null }),
      },
      {
        rpc: mockChain({
          data: null,
          error: { code: 'P0002', message: 'claimed', details: '', hint: '' },
        }),
      },
    )

    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara', row: 'row-1' })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Row already claimed',
    })
  })

  it('throws a validation error when neither row nor spectator is set', async () => {
    await expect(
      handler(joinEvent({ code: 'ABC234', name: 'Elara' })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('throws a 429 after too many join attempts from the same IP', async () => {
    mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

    for (let i = 0; i < 10; i++) {
      await expect(
        handler(joinEvent({ code: 'ZZZZZZ', name: 'Elara', row: 'row-1' })),
      ).rejects.toMatchObject({ statusCode: 404 })
    }

    await expect(
      handler(joinEvent({ code: 'ZZZZZZ', name: 'Elara', row: 'row-1' })),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })
})
