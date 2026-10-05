import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import type { SupabaseChain } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { verifyJWT } from '~~/server/utils/jwt'
import handler from '~~/server/api/emails/campaign-invite.post'

const appDomain = 'https://www.dnd-tracker.com'
const jwtSecret = 'test-secret'
const invitedUser = '11111111-1111-4111-8111-111111111111'
const invitedOwner = '22222222-2222-4222-8222-222222222222'

function body(overrides: Record<string, unknown> = {}) {
  return {
    campaignId: 42,
    userId: invitedUser,
    role: 'Viewer',
    locale: 'en',
    ...overrides,
  }
}

function mockTables({
  campaign = {
    data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' },
    error: null,
  },
  invitee = {
    data: { email: 'invitee@example.com', username: 'Invitee' },
    error: null,
  },
  membership = { data: null, error: null },
  invite = { data: { id: 7 }, error: null },
  inviter = { data: { username: 'DM' }, error: null },
}: {
  campaign?: Record<string, unknown>
  invitee?: Record<string, unknown>
  membership?: Record<string, unknown>
  invite?: Record<string, unknown>
  inviter?: Record<string, unknown>
} = {}): SupabaseChain {
  const joinCampaign = mockChain(invite)

  mockFrom({
    campaigns: mockChain(campaign),
    profiles: [mockChain(invitee), mockChain(inviter)],
    team: mockChain(membership),
    join_campaign: joinCampaign,
  })

  return joinCampaign
}

function sentInviteLink(): string {
  return mockFetch.mock.calls[0]![1].body.text.match(
    /https:\/\/\S+token=[\w.-]+/,
  )![0]
}

describe('POST /api/emails/campaign-invite', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({
      plunkApiKey: 'plunk-key',
      jwtSecret,
      public: { appDomain },
    })
  })

  it('sends the campaign invite email', async () => {
    mockTables()
    mockFetch.mockResolvedValue({ success: true })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual({ success: true })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://next-api.useplunk.com/v1/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          to: 'invitee@example.com',
          subject: 'New campaign invite',
        }),
      }),
    )
  })

  it('stores a signed invite token for the invited user', async () => {
    const joinCampaign = mockTables()
    mockFetch.mockResolvedValue({ success: true })

    await handler(mockEvent({ method: 'POST', body: body() }))

    const row = joinCampaign.insert.mock.calls[0]![0]

    expect(row).toMatchObject({
      campaign: 42,
      user: invitedUser,
      role: 'Viewer',
    })
    await expect(verifyJWT(jwtSecret, row.token)).resolves.toMatchObject({
      user: 'user-1',
      data: { campaign: 42, user: invitedUser, role: 'Viewer' },
    })
  })

  it('builds the invite link from the app domain and stored token', async () => {
    const joinCampaign = mockTables()
    mockFetch.mockResolvedValue({ success: true })

    await handler(mockEvent({ method: 'POST', body: body() }))

    const { token } = joinCampaign.insert.mock.calls[0]![0]

    expect(sentInviteLink()).toBe(`${appDomain}/campaigns/join?token=${token}`)
  })

  it('prefixes the invite link with a non-default locale', async () => {
    const joinCampaign = mockTables()
    mockFetch.mockResolvedValue({ success: true })

    await handler(mockEvent({ method: 'POST', body: body({ locale: 'nl' }) }))

    const { token } = joinCampaign.insert.mock.calls[0]![0]

    expect(sentInviteLink()).toBe(
      `${appDomain}/nl/campaigns/join?token=${token}`,
    )
  })

  it('throws a 404 when the invited user does not exist', async () => {
    const joinCampaign = mockTables({ invitee: { data: null, error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User not found',
    })
    expect(joinCampaign.insert).not.toHaveBeenCalled()
  })

  it('throws a 409 when the user is already on the team', async () => {
    const joinCampaign = mockTables({ membership: { data: { id: 3 } } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'alreadyAdded',
    })
    expect(joinCampaign.insert).not.toHaveBeenCalled()
  })

  it('throws a 409 when the user owns the campaign', async () => {
    const joinCampaign = mockChain({ data: { id: 7 }, error: null })

    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: invitedOwner },
        error: null,
      }),
      team: [mockChain({ data: { role: 'Admin' } }), mockChain({ data: null })],
      profiles: mockChain({
        data: { email: 'owner@example.com', username: 'Owner' },
        error: null,
      }),
      join_campaign: joinCampaign,
    })

    await expect(
      handler(
        mockEvent({ method: 'POST', body: body({ userId: invitedOwner }) }),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'alreadyAdded',
    })
    expect(joinCampaign.insert).not.toHaveBeenCalled()
  })

  it('throws a 409 when the user already has a pending invite', async () => {
    mockTables({
      invite: { data: null, error: { code: '23505', message: 'duplicate' } },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'alreadyInvited',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws when storing the invite fails', async () => {
    mockTables({
      invite: { data: null, error: { code: '42501', message: 'denied' } },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws a 500 when the invite insert returns no row', async () => {
    mockTables({ invite: { data: null, error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to create invite',
    })
  })

  it('removes the stored invite when sending the email fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const joinCampaign = mockTables()
    mockFetch.mockRejectedValue(new Error('network error'))

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to send email.' })

    expect(joinCampaign.delete).toHaveBeenCalled()
    expect(joinCampaign.eq).toHaveBeenCalledWith('id', 7)
  })

  it('throws a 403 when the caller cannot manage the campaign', async () => {
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

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an owner role', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: body({ role: 'Owner' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
