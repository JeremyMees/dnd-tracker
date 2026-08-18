import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockStorage } from '~~/test/unit/stubs/storage'
import {
  mockChain,
  mockFrom,
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/user/create.post'

const userId = '11111111-1111-4111-8111-111111111111'

const body = {
  email: 'dm@example.com',
  password: 'Sup3rSecret!',
  name: 'Jeremy',
  username: 'dungeon-master',
  marketing: true,
  avatar: 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E',
  avatarOptions: { headVariant: 'afro', backgroundColor: 'fee2e2' },
}

function mockSignUp(result: Record<string, unknown>) {
  const signUp = vi.fn().mockResolvedValue(result)

  serverSupabaseClient.mockResolvedValue({ auth: { signUp } })

  return signUp
}

function newUser() {
  return {
    data: { user: { id: userId, identities: [{ id: 'identity' }] } },
    error: null,
  }
}

describe('POST /api/user/create', () => {
  let deleteUser: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage()
    deleteUser = vi.fn().mockResolvedValue({ data: {}, error: null })
  })

  function mockProfiles(result: Record<string, unknown>) {
    const from = mockFrom({ profiles: mockChain(result) })

    serverSupabaseServiceRole.mockReturnValue({
      from,
      auth: { admin: { deleteUser } },
    })

    return from
  }

  it('signs the user up and inserts their profile', async () => {
    const signUp = mockSignUp(newUser())
    const from = mockProfiles({ error: null })

    await expect(handler(mockEvent({ method: 'POST', body }))).resolves.toEqual(
      { id: userId },
    )

    expect(signUp).toHaveBeenCalledWith({
      email: body.email,
      password: body.password,
    })

    const chain = from.mock.results[0]!.value
    expect(chain.insert).toHaveBeenCalledWith({
      id: userId,
      email: body.email,
      name: body.name,
      username: body.username,
      marketing: body.marketing,
      avatar: body.avatar,
      avatarOptions: body.avatarOptions,
    })
  })

  it('never sends the avatar to supabase auth metadata', async () => {
    const signUp = mockSignUp(newUser())
    mockProfiles({ error: null })

    await handler(mockEvent({ method: 'POST', body }))

    expect(signUp.mock.calls[0]![0]).not.toHaveProperty('options')
    expect(JSON.stringify(signUp.mock.calls[0])).not.toContain('data:image')
  })

  it('throws a 409 when the email is already registered', async () => {
    mockSignUp({ data: { user: { id: userId, identities: [] } }, error: null })

    await expect(
      handler(mockEvent({ method: 'POST', body })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Email already in use',
    })

    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('rolls back the auth user when the profile insert fails', async () => {
    mockSignUp(newUser())
    mockProfiles({ error: { message: 'duplicate key value' } })

    await expect(
      handler(mockEvent({ method: 'POST', body })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'duplicate key value',
    })

    expect(deleteUser).toHaveBeenCalledWith(userId)
  })

  it('surfaces a sign up error without touching profiles', async () => {
    mockSignUp({ data: { user: null }, error: { message: 'Signup disabled' } })

    await expect(
      handler(mockEvent({ method: 'POST', body })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Signup disabled',
    })
  })

  it('rate limits repeated registrations from the same ip', async () => {
    mockSignUp(newUser())
    mockProfiles({ error: null })

    const headers = { 'x-forwarded-for': '5.6.7.8' }

    for (let attempt = 0; attempt < 5; attempt++) {
      await handler(mockEvent({ method: 'POST', body, headers }))
    }

    await expect(
      handler(mockEvent({ method: 'POST', body, headers })),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { ...body, email: 'nope' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
