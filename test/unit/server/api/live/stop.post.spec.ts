import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/live/stop.post'

const encounter = { id: 7, campaign: null, createdBy: 'user-1' }

describe('POST /api/live/stop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('ends the active session for the encounter and broadcasts it', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: mockChain({
        data: { id: 3, uuid: 'session-uuid' },
        error: null,
      }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).resolves.toEqual({ success: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'ended',
      {},
    )
  })

  it('throws a 404 when there is no active session', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'no-active-session',
    })
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Encounter not found',
    })
  })

  it('throws a 403 when the caller has no access', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-2' },
        error: null,
      }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({ statusCode: 403 })
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
