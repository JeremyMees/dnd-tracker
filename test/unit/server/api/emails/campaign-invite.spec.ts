import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import handler from '~~/server/api/emails/campaign-invite.post'

const appDomain = 'https://dnd-tracker.com'
const inviteLink = `${appDomain}/campaigns/join?token=good-token`

function body(overrides: Record<string, unknown> = {}) {
  return {
    campaignId: 42,
    userId: '11111111-1111-4111-8111-111111111111',
    inviteLink,
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
  invite = { data: { id: 1 }, error: null },
  inviter = { data: { username: 'DM' }, error: null },
}: {
  campaign?: Record<string, unknown>
  invitee?: Record<string, unknown>
  invite?: Record<string, unknown>
  inviter?: Record<string, unknown>
} = {}) {
  mockFrom({
    campaigns: mockChain(campaign),
    profiles: [mockChain(invitee), mockChain(inviter)],
    join_campaign: mockChain(invite),
  })
}

describe('POST /api/emails/campaign-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ plunkApiKey: 'plunk-key', public: { appDomain } })
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

  it('throws a 404 when the invited user does not exist', async () => {
    mockTables({ invitee: { data: null, error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  })

  it('throws a 404 when the invite token does not match', async () => {
    mockTables({ invite: { data: null, error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Invite not found',
    })
  })

  it('throws a 400 for an invite link on the wrong domain', async () => {
    mockTables()

    await expect(
      handler(
        mockEvent({
          method: 'POST',
          body: body({ inviteLink: 'https://evil.com/campaigns/join?token=x' }),
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid invite link',
    })
  })

  it('throws when sending the email fails', async () => {
    mockTables()
    mockFetch.mockRejectedValue(new Error('network error'))

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to send email.' })
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

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(
        mockEvent({ method: 'POST', body: body({ inviteLink: 'not-a-url' }) }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
