import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/sync.post'

function syncEvent() {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/sync',
    params: { id: '7' },
  })
}

describe('POST /api/encounter/[id]/sync', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('increments the sheet version and broadcasts the current sheet', async () => {
    const sheet = {
      title: 'Ambush',
      round: 2,
      activeIndex: 1,
      rows: [],
      settings: {},
      info: null,
      infoCards: [],
    }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: sheet, error: null }),
        ],
      },
      { rpc: mockChain({ data: 3, error: null }) },
    )

    const result = await handler(syncEvent())

    expect(result).toEqual({ synced: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('increment_sheet_version', {
      p_encounter: 7,
    })

    const channel = supabase.channel('sheet:7')

    expect(channel.httpSend).toHaveBeenCalledWith('sync', {
      version: 3,
      sheet,
    })
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(handler(syncEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(syncEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})
