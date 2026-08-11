import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import {
  signLiveSeatToken,
  signLiveSessionToken,
} from '~~/server/utils/live-token'
import handler from '~~/server/api/live/state.get'

const future = new Date(Date.now() + 60_000)
const past = new Date(Date.now() - 1000)

const sheet = {
  id: 7,
  title: 'Ambush',
  round: 2,
  activeIndex: 0,
  settings: {},
  rows: [
    {
      id: 'row-1',
      index: 0,
      initiative: 15,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 20,
      maxHitPoints: 30,
    },
  ],
}

function eventWithToken(token: string, seatToken?: string) {
  const query = seatToken
    ? `token=${encodeURIComponent(token)}&seatToken=${encodeURIComponent(seatToken)}`
    : `token=${encodeURIComponent(token)}`

  return mockEvent({ method: 'GET', path: `/?${query}` })
}

describe('GET /api/live/state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  it('returns the sanitized sheet and session meta for a valid token', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future.toISOString(),
          endedAt: null,
          version: 3,
        },
        error: null,
      }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    await expect(handler(eventWithToken(token))).resolves.toEqual({
      sheet: {
        id: 7,
        title: 'Ambush',
        round: 2,
        activeIndex: 0,
        rows: [
          {
            id: 'row-1',
            index: 0,
            initiative: 15,
            name: 'Elara',
            type: 'player',
            conditions: [],
            healthBand: 'healthy',
          },
        ],
      },
      session: { code: 'ABC234', expiresAt: future.toISOString(), version: 3 },
    })
  })

  it('reveals real hp for the row claimed by a valid seat token', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )
    const seatToken = await signLiveSeatToken(
      {
        session: 'session-uuid',
        encounter: 7,
        seat: 'seat-1',
        name: 'Elara',
        spectator: false,
      },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future.toISOString(),
          endedAt: null,
          version: 3,
          seats: [
            { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
          ],
        },
        error: null,
      }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    const result = await handler(eventWithToken(token, seatToken))

    expect(result.sheet.rows[0]).toMatchObject({
      hitPoints: 20,
      maxHitPoints: 30,
    })
  })

  it('ignores a seat token for a different session and falls back to the generic view', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )
    const seatToken = await signLiveSeatToken(
      {
        session: 'other-session',
        encounter: 7,
        seat: 'seat-1',
        name: 'Elara',
        spectator: false,
      },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future.toISOString(),
          endedAt: null,
          version: 3,
          seats: [
            { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
          ],
        },
        error: null,
      }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    const result = await handler(eventWithToken(token, seatToken))

    expect(result.sheet.rows[0]).not.toHaveProperty('hitPoints')
    expect(result.sheet.rows[0]!.healthBand).toBe('healthy')
  })

  it('throws a 400 when no token is provided', async () => {
    await expect(
      handler(mockEvent({ method: 'GET', path: '/' })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Token not provided',
    })
  })

  it('throws a 401 for an invalid token', async () => {
    await expect(handler(eventWithToken('not-a-jwt'))).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid live session token',
    })
  })

  it('throws a 404 when the live session no longer exists', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )

    mockFrom({
      live_sessions: mockChain({ data: null, error: null }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it('throws a 410 when the session has ended', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future.toISOString(),
          endedAt: new Date().toISOString(),
        },
        error: null,
      }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 410 when the session has expired', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: { code: 'ABC234', expiresAt: past.toISOString(), endedAt: null },
        error: null,
      }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 404 when the encounter no longer exists', async () => {
    const token = await signLiveSessionToken(
      { session: 'session-uuid', encounter: 7 },
      future,
    )

    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future.toISOString(),
          endedAt: null,
        },
        error: null,
      }),
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Encounter not found',
    })
  })
})
