import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockStorage } from '~~/test/unit/stubs/storage'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/campaign/member-lookup.post'

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'bilbo',
  avatar: 'avatar-url',
}

function body(overrides: Record<string, unknown> = {}) {
  return { campaign: 42, email: 'bilbo@shire.com', ...overrides }
}

function mockTables({
  campaign = {
    data: { id: 42, title: 'Skyspire', createdBy: 'user-1' },
    error: null,
  },
  member,
  profiles = { data: [profile], error: null },
}: {
  campaign?: Record<string, unknown>
  member?: Record<string, unknown>
  profiles?: Record<string, unknown>
} = {}) {
  const profilesChain = mockChain(profiles)
  const tables: Record<string, ReturnType<typeof mockChain>> = {
    campaigns: mockChain(campaign),
    profiles: profilesChain,
  }

  if (member) tables.team = mockChain(member)

  mockFrom(tables)

  return { profilesChain }
}

describe('POST /api/campaign/member-lookup', () => {
  beforeEach(() => {
    mockStorage()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('returns only the display fields of an exact email match', async () => {
    const { profilesChain } = mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual(profile)
    expect(profilesChain.select).toHaveBeenCalledWith('id, username, avatar')
  })

  it('matches the address without wildcards so substrings cannot collide', async () => {
    const { profilesChain } = mockTables()

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(profilesChain.ilike).toHaveBeenCalledWith('email', 'bilbo@shire.com')
  })

  it('escapes the underscore wildcard in the address', async () => {
    const { profilesChain } = mockTables()

    await handler(
      mockEvent({ method: 'POST', body: body({ email: 'a_b@shire.com' }) }),
    )

    expect(profilesChain.ilike).toHaveBeenCalledWith('email', 'a\\_b@shire.com')
  })

  it('returns null when no profile owns the address', async () => {
    mockTables({ profiles: { data: [], error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toBeNull()
  })

  it('lets an admin of the campaign look up an address', async () => {
    mockTables({
      campaign: {
        data: { id: 42, title: 'Skyspire', createdBy: 'someone-else' },
        error: null,
      },
      member: { data: { role: 'Admin' }, error: null },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual(profile)
  })

  it('throws a 403 when the caller only views the campaign', async () => {
    mockTables({
      campaign: {
        data: { id: 42, title: 'Skyspire', createdBy: 'someone-else' },
        error: null,
      },
      member: { data: { role: 'Viewer' }, error: null },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 403 when the caller has no access to the campaign', async () => {
    mockTables({
      campaign: {
        data: { id: 42, title: 'Skyspire', createdBy: 'someone-else' },
        error: null,
      },
      member: { data: null, error: null },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 401 when there is no session', async () => {
    mockTables()
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects an address that is not an email', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body({ email: 'nope' }) })),
    ).rejects.toThrow()
  })

  it('rate limits repeated lookups from the same address', async () => {
    mockTables()

    for (let i = 0; i < 20; i++) {
      await handler(mockEvent({ method: 'POST', body: body() }))
    }

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 429 })
  })
})
