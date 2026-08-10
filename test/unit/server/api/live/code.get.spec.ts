import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/live/code.get'

const future = new Date(Date.now() + 60_000).toISOString()

function eventWithCode(code: string) {
  return mockEvent({
    method: 'GET',
    path: `/?code=${encodeURIComponent(code)}`,
  })
}

describe('GET /api/live/code', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the code and expiry for an active session', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: { code: 'ABC234', expiresAt: future, endedAt: null },
        error: null,
      }),
    })

    await expect(handler(eventWithCode('abc234'))).resolves.toEqual({
      code: 'ABC234',
      expiresAt: future,
    })
  })

  it('throws a 400 when no code is provided', async () => {
    await expect(
      handler(mockEvent({ method: 'GET', path: '/' })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Code not provided',
    })
  })

  it('throws a 400 when the code is not 6 characters', async () => {
    await expect(handler(eventWithCode('short'))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Code not provided',
    })
  })

  it('throws a 404 when the room code does not exist', async () => {
    mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

    await expect(handler(eventWithCode('ZZZZZZ'))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it('throws a 410 when the session has ended', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: future,
          endedAt: new Date().toISOString(),
        },
        error: null,
      }),
    })

    await expect(handler(eventWithCode('ABC234'))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 410 when the session has expired', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: {
          code: 'ABC234',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          endedAt: null,
        },
        error: null,
      }),
    })

    await expect(handler(eventWithCode('ABC234'))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })
})
