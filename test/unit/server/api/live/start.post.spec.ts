import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { verifyLiveSessionToken } from '~~/server/utils/live-token'
import handler from '~~/server/api/live/start.post'

const encounter = { id: 7, campaign: null, createdBy: 'user-1' }
const future = new Date(Date.now() + 60_000).toISOString()

describe('POST /api/live/start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  it('creates a new session when none is active', async () => {
    mockFrom({
      profiles: mockChain({ data: { subscriptionType: 'pro' }, error: null }),
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: [
        mockChain({ data: null, error: null }),
        mockChain({
          data: {
            uuid: 'session-uuid',
            code: 'ABC234',
            expiresAt: future,
            seats: [],
          },
          error: null,
        }),
      ],
    })

    const result = await handler(
      mockEvent({ method: 'POST', body: { encounter: 7 } }),
    )

    expect(result).toEqual({
      token: expect.any(String),
      uuid: 'session-uuid',
      code: 'ABC234',
      expiresAt: future,
      seats: [],
    })

    await expect(
      verifyLiveSessionToken((result as { token: string }).token),
    ).resolves.toMatchObject({ session: 'session-uuid', encounter: 7 })
  })

  it('returns the existing active session instead of creating a new one', async () => {
    mockFrom({
      profiles: mockChain({ data: { subscriptionType: 'pro' }, error: null }),
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: mockChain({
        data: {
          uuid: 'existing-uuid',
          code: 'XYZ789',
          expiresAt: future,
          seats: [
            { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
          ],
        },
        error: null,
      }),
    })

    const result = await handler(
      mockEvent({ method: 'POST', body: { encounter: 7 } }),
    )

    expect(result).toEqual({
      token: expect.any(String),
      uuid: 'existing-uuid',
      code: 'XYZ789',
      expiresAt: future,
      seats: [
        { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
      ],
    })
  })

  it('retries code generation on a unique violation', async () => {
    mockFrom({
      profiles: mockChain({ data: { subscriptionType: 'pro' }, error: null }),
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: [
        mockChain({ data: null, error: null }),
        mockChain({
          data: null,
          error: { code: '23505', message: 'duplicate', details: '', hint: '' },
        }),
        mockChain({
          data: { uuid: 'session-uuid', code: 'DEF456', expiresAt: future },
          error: null,
        }),
      ],
    })

    const result = await handler(
      mockEvent({ method: 'POST', body: { encounter: 7 } }),
    )

    expect(result).toMatchObject({ code: 'DEF456' })
  })

  it('throws a 403 when the caller is not on a pro subscription', async () => {
    mockFrom({
      profiles: mockChain({ data: { subscriptionType: 'free' }, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'pro-required',
    })
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockFrom({
      profiles: mockChain({ data: { subscriptionType: 'pro' }, error: null }),
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Encounter not found',
    })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: -1 } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
