import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/live/reassign.post'

const encounter = { id: 7, campaign: null, createdBy: 'user-1' }
const sheet = { rows: [{ id: 'row-1' }, { id: 'row-2' }] }

function reassignEvent(body: Record<string, unknown>) {
  return mockEvent({ method: 'POST', body })
}

describe('POST /api/encounter/live/reassign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('reassigns the seat to a new row and broadcasts the change', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({ data: encounter, error: null }),
          mockChain({ data: sheet, error: null }),
        ],
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      {
        rpc: mockChain({
          data: {
            seat: 'seat-1',
            row: 'row-2',
            name: 'Elara',
            spectator: false,
          },
          error: null,
        }),
      },
    )

    const result = await handler(
      reassignEvent({ encounter: 7, seat: 'seat-1', row: 'row-2' }),
    )

    expect(result).toEqual({
      seat: { seat: 'seat-1', row: 'row-2', name: 'Elara', spectator: false },
    })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('reassign_live_seat', {
      p_session: 'session-uuid',
      p_seat: 'seat-1',
      p_row: 'row-2',
    })
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'seats',
      { type: 'reassigned', seat: 'seat-1', row: 'row-2' },
    )
  })

  it('throws a 404 when there is no active session', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: encounter, error: null }),
      live_sessions: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(reassignEvent({ encounter: 7, seat: 'seat-1', row: 'row-2' })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'no-active-session',
    })
  })

  it('throws a 404 when the row does not belong to the encounter', async () => {
    mockFrom({
      initiative_sheets: [
        mockChain({ data: encounter, error: null }),
        mockChain({ data: sheet, error: null }),
      ],
      live_sessions: mockChain({ data: { uuid: 'session-uuid' }, error: null }),
    })

    await expect(
      handler(reassignEvent({ encounter: 7, seat: 'seat-1', row: 'missing' })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'row-not-found',
    })
  })

  it('throws a 409 when the row is already claimed by another seat', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({ data: encounter, error: null }),
          mockChain({ data: sheet, error: null }),
        ],
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      {
        rpc: mockChain({
          data: null,
          error: { code: 'P0001', message: 'claimed', details: '', hint: '' },
        }),
      },
    )

    await expect(
      handler(reassignEvent({ encounter: 7, seat: 'seat-1', row: 'row-2' })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'row-claimed',
    })
  })

  it('throws a 404 when the seat does not exist', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({ data: encounter, error: null }),
          mockChain({ data: sheet, error: null }),
        ],
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
      handler(reassignEvent({ encounter: 7, seat: 'seat-1', row: 'row-2' })),
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
      handler(reassignEvent({ encounter: 7, seat: 'seat-1', row: 'row-2' })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(reassignEvent({ encounter: -1, seat: '', row: '' })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
