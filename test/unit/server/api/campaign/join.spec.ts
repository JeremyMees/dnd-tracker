import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateJWT } from 'oslo/jwt'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import handler from '~~/server/api/campaign/join.post'

const secret = new TextEncoder().encode('test-secret')
const invitedUser = '11111111-1111-4111-8111-111111111111'

function body(overrides: Record<string, unknown> = {}) {
  return {
    campaign: 42,
    user: invitedUser,
    role: 'Player',
    ...overrides,
  }
}

describe('POST /api/campaign/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  it('signs an invite JWT when the caller owns the campaign', async () => {
    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' },
        error: null,
      }),
    })

    const token = await handler(mockEvent({ method: 'POST', body: body() }))

    const jwt = await validateJWT('HS256', secret, token as string)

    expect(jwt.payload).toMatchObject({
      user: 'user-1',
      data: body(),
    })
  })

  it('signs an invite JWT when the caller is a campaign admin', async () => {
    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-2' },
        error: null,
      }),
      team: mockChain({ data: { role: 'Admin' } }),
    })

    const token = await handler(mockEvent({ method: 'POST', body: body() }))

    const jwt = await validateJWT('HS256', secret, token as string)

    expect(jwt.payload).toMatchObject({ user: 'user-1' })
  })

  it('throws a 403 when the caller only has viewer access', async () => {
    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-2' },
        error: null,
      }),
      team: mockChain({ data: { role: 'Viewer' } }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 404 when the campaign does not exist', async () => {
    mockFrom({
      campaigns: mockChain({ data: null, error: null }),
      team: mockChain({ data: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: body({ role: 'Owner' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
