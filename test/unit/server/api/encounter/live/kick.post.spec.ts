import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/live/kick.post'

const encounter = { id: 7, campaign: null, createdBy: 'user-1' }

describe('POST /api/encounter/live/kick', () => {
  beforeEach(() => {
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('removes the seat and broadcasts the change', async () => {
    mockFrom(
      {
        initiative_sheets: mockChain({ data: encounter, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      { rpc: mockChain({ data: { seat: 'seat-1' }, error: null }) },
    )

    await expect(
      handler(
        mockEvent({ method: 'POST', body: { encounter: 7, seat: 'seat-1' } }),
      ),
    ).resolves.toEqual({ success: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('remove_live_seat', {
      p_session: 'session-uuid',
      p_seat: 'seat-1',
    })
    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'seats',
      { type: 'kicked', seat: 'seat-1' },
    )
  })

  it('throws a 404 when there is no active session', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(
        mockEvent({ method: 'POST', body: { encounter: 7, seat: 'seat-1' } }),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'no-active-session',
    })
  })

  it('throws a 404 when the seat does not exist', async () => {
    mockFrom(
      {
        initiative_sheets: mockChain({ data: encounter, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      {
        rpc: mockChain({
          data: null,
          error: { code: 'P0002', message: 'missing', details: '', hint: '' },
        }),
      },
    )

    await expect(
      handler(
        mockEvent({ method: 'POST', body: { encounter: 7, seat: 'seat-1' } }),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'seat-not-found',
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
      handler(
        mockEvent({ method: 'POST', body: { encounter: 7, seat: 'seat-1' } }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: -1, seat: '' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
