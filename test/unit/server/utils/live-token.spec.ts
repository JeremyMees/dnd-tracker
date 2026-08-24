import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { signJWT } from '~~/server/utils/jwt'
import {
  signLiveRowToken,
  signLiveSeatToken,
  signLiveSessionToken,
  verifyLiveRowToken,
  verifyLiveSeatToken,
  verifyLiveSessionToken,
} from '~~/server/utils/live-token'

const secret = 'test-secret'
const future = new Date(Date.now() + 60_000)
const past = new Date(Date.now() - 1000)

function rawToken(payload: Record<string, unknown>) {
  return signJWT(secret, payload, future)
}

describe('live-token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
  })

  describe('session token', () => {
    it('round-trips the session and encounter claims', async () => {
      const token = await signLiveSessionToken(
        { session: 'ABC123', encounter: 7 },
        future,
      )

      await expect(verifyLiveSessionToken(token)).resolves.toMatchObject({
        kind: 'session',
        session: 'ABC123',
        encounter: 7,
      })
    })

    it('throws a 401 for a malformed token', async () => {
      await expect(verifyLiveSessionToken('not-a-jwt')).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Invalid live session token',
      })
    })

    it('throws a 401 for an expired token', async () => {
      const token = await signLiveSessionToken(
        { session: 'ABC123', encounter: 7 },
        past,
      )

      await expect(verifyLiveSessionToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws a 401 for a token signed with a different secret', async () => {
      const token = await signJWT(
        'other-secret',
        { kind: 'session', session: 'ABC123', encounter: 7 },
        future,
      )

      await expect(verifyLiveSessionToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws a 401 when a claim is missing', async () => {
      const token = await rawToken({ kind: 'session', session: 'ABC123' })

      await expect(verifyLiveSessionToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws a 401 for a seat token presented as a session token', async () => {
      const token = await signLiveSeatToken(
        {
          session: 'ABC123',
          encounter: 7,
          seat: 'seat-1',
          name: 'Elara',
          spectator: false,
        },
        future,
      )

      await expect(verifyLiveSessionToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  describe('seat token', () => {
    it('round-trips the seat claims, including a spectator seat', async () => {
      const token = await signLiveSeatToken(
        {
          session: 'ABC123',
          encounter: 7,
          seat: 'seat-1',
          name: 'Elara',
          spectator: true,
        },
        future,
      )

      await expect(verifyLiveSeatToken(token)).resolves.toMatchObject({
        kind: 'seat',
        session: 'ABC123',
        encounter: 7,
        seat: 'seat-1',
        name: 'Elara',
        spectator: true,
      })
    })

    it('throws a 401 when a claim is missing', async () => {
      const token = await rawToken({
        kind: 'seat',
        session: 'ABC123',
        encounter: 7,
        seat: 'seat-1',
      })

      await expect(verifyLiveSeatToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws a 401 for a row token presented as a seat token', async () => {
      const token = await signLiveRowToken(
        { session: 'ABC123', encounter: 7, row: 'row-1' },
        future,
      )

      await expect(verifyLiveSeatToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  describe('row token', () => {
    it('round-trips the row claim', async () => {
      const token = await signLiveRowToken(
        { session: 'ABC123', encounter: 7, row: 'row-1' },
        future,
      )

      await expect(verifyLiveRowToken(token)).resolves.toMatchObject({
        kind: 'row',
        session: 'ABC123',
        encounter: 7,
        row: 'row-1',
      })
    })

    it('throws a 401 when a claim is missing', async () => {
      const token = await rawToken({
        kind: 'row',
        session: 'ABC123',
        encounter: 7,
      })

      await expect(verifyLiveRowToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws a 401 for a session token presented as a row token', async () => {
      const token = await signLiveSessionToken(
        { session: 'ABC123', encounter: 7 },
        future,
      )

      await expect(verifyLiveRowToken(token)).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })
})
