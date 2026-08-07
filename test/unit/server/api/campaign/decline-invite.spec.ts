import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/campaign/decline-invite.post'

describe('POST /api/campaign/decline-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('removes the invite token for the caller', async () => {
    const del = mockChain({ error: null })
    mockFrom({ join_campaign: del })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token: 'good-token' } })),
    ).resolves.toBeUndefined()

    expect(del.match).toHaveBeenCalledWith({
      token: 'good-token',
      user: 'user-1',
    })
  })

  it('throws when removing the invite token fails', async () => {
    mockFrom({
      join_campaign: mockChain({
        error: {
          code: '08006',
          message: 'connection failure',
          details: '',
          hint: '',
        },
      }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token: 'good-token' } })),
    ).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { code: '08006' },
    })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: { token: 'good-token' } })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    mockFrom({ join_campaign: mockChain({ error: null }) })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token: '' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
