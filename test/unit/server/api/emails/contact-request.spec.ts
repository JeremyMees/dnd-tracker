import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { mockEmailTemplates } from '~~/test/unit/stubs/email'
import { mockStorage } from '~~/test/unit/stubs/storage'
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
    mockStorage()
    mockEmailTemplates()
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

  it('fills the email with the sender details and the current date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-03T12:00:00Z'))
    mockFetch.mockResolvedValue({ success: true })

    await handler(mockEvent({ method: 'POST', body: body() }))

    vi.useRealTimers()

    const { body: sent } = mockFetch.mock.calls[0]![1]

    expect(sent.text).toBe(
      'date=3-8-2026\nemail=jeremy@example.com\nname=Jeremy\nquestion=How do I share an encounter?',
    )
    expect(sent.body).toContain('email=jeremy@example.com')
  })

  it('omits the name when none is given', async () => {
    mockFetch.mockResolvedValue({ success: true })

    await handler(
      mockEvent({ method: 'POST', body: body({ name: undefined }) }),
    )

    const { text } = mockFetch.mock.calls[0]![1].body

    expect(text).not.toContain('name=')
    expect(text).toContain('question=How do I share an encounter?')
  })

  it('throws when sending the email fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
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

  it('throws a 429 after too many contact requests from the same IP', async () => {
    mockFetch.mockResolvedValue({ success: true })

    for (let i = 0; i < 5; i++) {
      await handler(mockEvent({ method: 'POST', body: body() }))
    }

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })
})
