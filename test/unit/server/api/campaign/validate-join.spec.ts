import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createJWT } from 'oslo/jwt'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import handler from '~~/server/api/campaign/validate-join.post'

const secretString = 'test-secret'
const secret = new TextEncoder().encode(secretString)

function signInvite(data: Record<string, unknown>, key = secret) {
  return createJWT('HS256', key, { data })
}

describe('POST /api/campaign/validate-join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: secretString })
  })

  it('returns the invite payload for a valid token', async () => {
    const data = { campaign: 42, user: 'user-1', role: 'Player' }
    const token = await signInvite(data)

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).resolves.toEqual(data)
  })

  it('throws when no token is provided', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: {} })),
    ).rejects.toMatchObject({ message: 'Token not provided' })
  })

  it('throws when the token signature is invalid', async () => {
    const token = await signInvite(
      { campaign: 42, user: 'user-1', role: 'Player' },
      new TextEncoder().encode('wrong-secret'),
    )

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toThrow('Invalid signature')
  })

  it('throws when the payload is missing invite data', async () => {
    const token = await signInvite({ foo: 'bar' })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ message: 'Invalid JWT' })
  })
})
