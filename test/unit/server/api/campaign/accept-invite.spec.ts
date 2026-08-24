import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { signJWT } from '~~/server/utils/jwt'
import handler from '~~/server/api/campaign/accept-invite.post'

const secretString = 'test-secret'
const future = new Date(Date.now() + 60_000)

const joinCampaign = {
  id: 1,
  campaign: 42,
  role: 'Player',
  user: 'user-1',
}

function signInvite(data: Record<string, unknown>, key = secretString) {
  return signJWT(key, { data }, future)
}

function validInvite() {
  return signInvite({ campaign: 42, user: 'user-1', role: 'Player' })
}

function mockTables({
  joinResult = { data: joinCampaign, error: null },
  insertResult = {
    data: [{ id: 7, role: 'Player', user: 'user-1' }],
    error: null,
  },
  deleteResult = { error: null },
}: {
  joinResult?: Record<string, unknown>
  insertResult?: Record<string, unknown>
  deleteResult?: Record<string, unknown>
} = {}) {
  const select = mockChain(joinResult)
  const del = mockChain(deleteResult)
  const insert = mockChain(insertResult)

  const from = mockFrom({
    join_campaign: [select, del],
    team: insert,
  })

  return { from, select, del, insert }
}

describe('POST /api/campaign/accept-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ jwtSecret: secretString })
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('joins the campaign and removes the invite token', async () => {
    const { from, select, del, insert } = mockTables()
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).resolves.toEqual([{ id: 7, role: 'Player', user: 'user-1' }])

    expect(select.match).toHaveBeenCalledWith({ token, user: 'user-1' })
    expect(insert.insert).toHaveBeenCalledWith({
      campaign: 42,
      role: 'Player',
      user: 'user-1',
    })
    expect(del.eq).toHaveBeenCalledWith('id', 1)
    expect(from).toHaveBeenCalledWith('join_campaign')
    expect(from).toHaveBeenCalledWith('team')
  })

  it('throws when the token signature is invalid', async () => {
    const { select } = mockTables()
    const token = await signInvite(
      { campaign: 42, user: 'user-1', role: 'Player' },
      'wrong-secret',
    )

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toThrow('Invalid signature')

    expect(select.match).not.toHaveBeenCalled()
  })

  it('throws when the token payload is missing invite data', async () => {
    const { select } = mockTables()
    const token = await signInvite({ foo: 'bar' })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ message: 'Invalid JWT' })

    expect(select.match).not.toHaveBeenCalled()
  })

  it('throws when the token was issued for another user', async () => {
    const { select } = mockTables()
    const token = await signInvite({
      campaign: 42,
      user: 'user-2',
      role: 'Player',
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ message: 'Join campaign token not found' })

    expect(select.match).not.toHaveBeenCalled()
  })

  it('throws when the stored role does not match the signed token', async () => {
    const { insert } = mockTables({
      joinResult: {
        data: { ...joinCampaign, role: 'Owner' },
        error: null,
      },
    })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ message: 'Join campaign token not found' })

    expect(insert.insert).not.toHaveBeenCalled()
  })

  it('throws when the stored campaign does not match the signed token', async () => {
    const { insert } = mockTables({
      joinResult: {
        data: { ...joinCampaign, campaign: 99 },
        error: null,
      },
    })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ message: 'Join campaign token not found' })

    expect(insert.insert).not.toHaveBeenCalled()
  })

  it('throws when the invite token cannot be found', async () => {
    mockTables({ joinResult: { data: null, error: { message: 'no rows' } } })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Join campaign token not found',
    })
  })

  it('throws when the invite token query returns no data', async () => {
    mockTables({ joinResult: { data: null, error: null } })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Join campaign token not found',
    })
  })

  it('throws when adding the team member fails', async () => {
    const { del } = mockTables({
      insertResult: {
        data: null,
        error: { code: '23505', message: 'duplicate', details: '', hint: '' },
      },
    })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Conflict',
      data: { code: '23505' },
    })

    expect(del.eq).not.toHaveBeenCalled()
  })

  it('throws when removing the invite token fails', async () => {
    mockTables({
      deleteResult: {
        error: {
          code: '08006',
          message: 'connection failure',
          details: '',
          hint: '',
        },
      },
    })
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { code: '08006' },
    })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)
    const token = await validInvite()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token } })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: { token: '' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
