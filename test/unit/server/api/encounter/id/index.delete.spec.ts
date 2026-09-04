import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/index.delete'

function deleteEvent() {
  return mockEvent({
    method: 'DELETE',
    path: '/api/encounter/7',
    params: { id: '7' },
  })
}

describe('DELETE /api/encounter/[id]', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('deletes the encounter and broadcasts when the caller owns it', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    const result = await handler(deleteEvent())

    expect(result).toEqual({ deleted: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.from('initiative_sheets').delete).toHaveBeenCalled()
    expect(supabase.from('initiative_sheets').eq).toHaveBeenCalledWith('id', 7)

    const channel = supabase.channel('sheet:7')

    expect(channel.httpSend).toHaveBeenCalledWith('deleted', {})
  })

  it('deletes when the caller is the campaign owner', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: 42, createdBy: 'someone-else' },
        error: null,
      }),
      campaigns: mockChain({
        data: { id: 42, title: 'Skyspire', createdBy: 'user-1' },
        error: null,
      }),
    })

    await expect(handler(deleteEvent())).resolves.toEqual({ deleted: true })
  })

  it('deletes when the caller is a campaign admin', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: 42, createdBy: 'someone-else' },
        error: null,
      }),
      campaigns: mockChain({
        data: { id: 42, title: 'Skyspire', createdBy: 'campaign-owner' },
        error: null,
      }),
      team: mockChain({ data: { role: 'Admin' }, error: null }),
    })

    await expect(handler(deleteEvent())).resolves.toEqual({ deleted: true })
  })

  it('throws a 403 when the caller is only a campaign player', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: 42, createdBy: 'someone-else' },
        error: null,
      }),
      campaigns: mockChain({
        data: { id: 42, title: 'Skyspire', createdBy: 'campaign-owner' },
        error: null,
      }),
      team: mockChain({ data: { role: 'Player' }, error: null }),
    })

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws a 403 when the encounter has no campaign and the caller is not the creator', async () => {
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

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('propagates a postgres error from the delete', async () => {
    mockFrom({
      initiative_sheets: [
        mockChain({
          data: { id: 7, campaign: null, createdBy: 'user-1' },
          error: null,
        }),
        mockChain({
          data: null,
          error: { code: '23503', message: 'boom', details: '', hint: '' },
        }),
      ],
    })

    await expect(handler(deleteEvent())).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})
