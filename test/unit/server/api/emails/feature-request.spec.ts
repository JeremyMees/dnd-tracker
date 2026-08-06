import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import handler from '~~/server/api/emails/feature-request.post'

function body(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Dark mode',
    text: 'It would be great to have a dark mode for late-night sessions.',
    ...overrides,
  }
}

describe('POST /api/emails/feature-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ plunkApiKey: 'plunk-key' })
  })

  it('sends the feature request email using the profile identity', async () => {
    mockFrom({
      profiles: mockChain({
        data: { username: 'Jeremy', email: 'jeremy@example.com' },
        error: null,
      }),
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
          to: 'jeremy@dnd-tracker.com',
          subject: 'New feature request',
        }),
      }),
    )
  })

  it('falls back to the caller claims when no profile exists', async () => {
    mockFrom({ profiles: mockChain({ data: null, error: null }) })
    mockFetch.mockResolvedValue({ success: true })

    await handler(mockEvent({ method: 'POST', body: body() }))

    expect(mockFetch).toHaveBeenCalled()
  })

  it('throws when sending the email fails', async () => {
    mockFrom({
      profiles: mockChain({
        data: { username: 'Jeremy', email: 'jeremy@example.com' },
        error: null,
      }),
    })
    mockFetch.mockRejectedValue(new Error('network error'))

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to send email.' })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: body({ title: 'a' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
