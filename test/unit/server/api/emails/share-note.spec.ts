import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import handler from '~~/server/api/emails/share-note.post'

function body(overrides: Record<string, unknown> = {}) {
  return {
    noteId: 7,
    email: 'friend@example.com',
    ...overrides,
  }
}

function mockTables({
  note = {
    data: {
      id: 7,
      title: 'Session 1 recap',
      text: '<p>Hello</p>',
      campaign: 42,
    },
    error: null,
  },
  campaign = {
    data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-1' },
    error: null,
  },
  sender = { data: { username: 'Jeremy' }, error: null },
}: {
  note?: Record<string, unknown>
  campaign?: Record<string, unknown>
  sender?: Record<string, unknown>
} = {}) {
  mockFrom({
    notes: mockChain(note),
    campaigns: mockChain(campaign),
    profiles: mockChain(sender),
  })
}

describe('POST /api/emails/share-note', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
    mockRuntimeConfig({ plunkApiKey: 'plunk-key' })
  })

  it('sends the shared note email', async () => {
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
          to: 'friend@example.com',
          subject: 'New Note Shared from Curse of Strahd!',
        }),
      }),
    )
  })

  it('throws a 404 when the note does not exist', async () => {
    mockTables({ note: { data: null, error: null } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Note not found',
    })
  })

  it('throws a 403 when the caller has no campaign access', async () => {
    mockFrom({
      notes: mockChain({
        data: { id: 7, title: 'Session 1 recap', text: '', campaign: 42 },
        error: null,
      }),
      campaigns: mockChain({
        data: { id: 42, title: 'Curse of Strahd', createdBy: 'user-2' },
        error: null,
      }),
      team: mockChain({ data: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws when sending the email fails', async () => {
    mockTables()
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
      handler(
        mockEvent({ method: 'POST', body: body({ email: 'not-an-email' }) }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
