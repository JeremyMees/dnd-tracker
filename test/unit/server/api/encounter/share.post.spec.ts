import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateJWT } from 'oslo/jwt'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import handler from '~~/server/api/encounter/share.post'

const secret = new TextEncoder().encode('test-secret')

describe('POST /api/encounter/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  it('signs a share JWT when the caller owns the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    const token = await handler(
      mockEvent({ method: 'POST', body: { encounter: 7 } }),
    )

    const jwt = await validateJWT('HS256', secret, token as string)

    expect(jwt.payload).toMatchObject({ user: 'user-1', encounter: 7 })
  })

  it('signs a share JWT when the caller has campaign access', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: 42, createdBy: 'user-2' },
        error: null,
      }),
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-2' },
        error: null,
      }),
      team: mockChain({ data: { role: 'Player' } }),
    })

    const token = await handler(
      mockEvent({ method: 'POST', body: { encounter: 7 } }),
    )

    const jwt = await validateJWT('HS256', secret, token as string)

    expect(jwt.payload).toMatchObject({ user: 'user-1', encounter: 7 })
  })

  it('throws a 403 when the encounter has no campaign and the caller is not the owner', async () => {
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

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({ statusCode: 401 })
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
