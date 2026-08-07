import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import handler from '~~/server/api/emails/campaign-invite-no-user.post'

function body(overrides: Record<string, unknown> = {}) {
  return {
    campaignId: 42,
    email: 'new-player@example.com',
    ...overrides,
  }
}

describe('POST /api/emails/campaign-invite-no-user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ plunkApiKey: 'plunk-key' })
  })

  it('sends the campaign invite email to a new user', async () => {
    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' },
        error: null,
      }),
      profiles: mockChain({ data: { username: 'DM' }, error: null }),
    })
    mockFetch.mockResolvedValue({ success: true })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toEqual({ success: true })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://next-api.useplunk.com/v1/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          to: 'new-player@example.com',
          subject: 'Added to a campaign on DnD Tracker',
        }),
      }),
    )
  })

  it('throws when sending the email fails', async () => {
    mockFrom({
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' },
        error: null,
      }),
      profiles: mockChain({ data: { username: 'DM' }, error: null }),
    })
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
        mockEvent({ method: 'POST', body: body({ email: 'not-an-email' }) }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
