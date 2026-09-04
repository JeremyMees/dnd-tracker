import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/events.delete'

function deleteEvent(id = '7') {
  return mockEvent({
    method: 'DELETE',
    path: `/api/encounter/${id}/events`,
    params: { id },
  })
}

describe('DELETE /api/encounter/[id]/events', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('deletes every combat event for the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
      combat_events: mockChain({ data: null, error: null }),
    })

    expect(await handler(deleteEvent())).toEqual({ deleted: true })

    const supabase = serverSupabaseServiceRole({} as never)
    const table = supabase.from('combat_events')

    expect(table.delete).toHaveBeenCalled()
    expect(table.eq).toHaveBeenCalledWith('encounterId', 7)
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('rejects a non-numeric encounter id', async () => {
    await expect(handler(deleteEvent('abc'))).rejects.toMatchObject({
      statusCode: 400,
    })
  })
})
