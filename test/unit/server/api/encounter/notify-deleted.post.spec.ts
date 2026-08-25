import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/notify-deleted.post'

function notifyEvent() {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/notify-deleted',
    params: { id: '7' },
  })
}

describe('POST /api/encounter/[id]/notify-deleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('broadcasts a deleted event over the sheet channel', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    const result = await handler(notifyEvent())

    expect(result).toEqual({ notified: true })

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('sheet:7')

    expect(channel.httpSend).toHaveBeenCalledWith('deleted', {})
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(handler(notifyEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(notifyEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})
