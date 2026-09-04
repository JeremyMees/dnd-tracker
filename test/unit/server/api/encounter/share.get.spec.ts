import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { signJWT } from '~~/server/utils/jwt'
import handler from '~~/server/api/encounter/share.get'

const secret = 'test-secret'
const future = new Date(Date.now() + 60_000)

function signShare(payload: Record<string, unknown>) {
  return signJWT(secret, payload, future)
}

function eventWithToken(token: string) {
  return mockEvent({
    method: 'GET',
    path: `/?token=${encodeURIComponent(token)}`,
  })
}

describe('GET /api/encounter/share', () => {
  beforeEach(() => {
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  it('returns the encounter for the owner', async () => {
    const token = await signShare({ encounter: 7, user: 'user-1' })
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, createdBy: 'user-1', campaign: null },
        error: null,
      }),
    })

    await expect(handler(eventWithToken(token))).resolves.toEqual({
      id: 7,
      createdBy: 'user-1',
      campaign: null,
    })
  })

  it('returns the encounter for a campaign team member', async () => {
    const token = await signShare({ encounter: 7, user: 'user-2' })
    mockFrom({
      initiative_sheets: mockChain({
        data: {
          id: 7,
          createdBy: 'user-1',
          campaign: { id: 42, team: [{ user: { id: 'user-2' } }] },
        },
        error: null,
      }),
    })

    await expect(handler(eventWithToken(token))).resolves.toMatchObject({
      id: 7,
    })
  })

  it('throws a 403 when the caller has no access', async () => {
    const token = await signShare({ encounter: 7, user: 'user-3' })
    mockFrom({
      initiative_sheets: mockChain({
        data: {
          id: 7,
          createdBy: 'user-1',
          campaign: { id: 42, team: [{ user: { id: 'user-2' } }] },
        },
        error: null,
      }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
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
      statusMessage: 'Invalid JWT',
    })
  })

  it('throws when the encounter lookup fails', async () => {
    const token = await signShare({ encounter: 7, user: 'user-1' })
    mockFrom({
      initiative_sheets: mockChain({
        data: null,
        error: {
          code: '08006',
          message: 'connection failure',
          details: '',
          hint: '',
        },
      }),
    })

    await expect(handler(eventWithToken(token))).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { code: '08006' },
    })
  })
})
