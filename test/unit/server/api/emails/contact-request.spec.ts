import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import handler from '~~/server/api/emails/contact-request.post'

function body(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Jeremy',
    email: 'jeremy@example.com',
    question: 'How do I share an encounter?',
    ...overrides,
  }
}

describe('POST /api/emails/contact-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockRuntimeConfig({ plunkApiKey: 'plunk-key' })
  })

  it('sends the contact request email', async () => {
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
          subject: 'New contact request/question',
        }),
      }),
    )
  })

  it('throws when sending the email fails', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ message: 'Failed to send email.' })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: body({ question: 'hi' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
