import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/events.post'

function postEvent(body: unknown, id = '7') {
  return mockEvent({
    method: 'POST',
    path: `/api/encounter/${id}/events`,
    params: { id },
    body,
  })
}

const access = mockChain({
  data: { id: 7, campaign: null, createdBy: 'user-1' },
  error: null,
})

describe('POST /api/encounter/[id]/events', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('logs the events in the current round and tells the sheet channel', async () => {
    mockFrom({
      initiative_sheets: [
        access,
        mockChain({ data: { round: 3 }, error: null }),
      ],
      combat_events: mockChain({ data: null, error: null }),
    })

    const result = await handler(
      postEvent({
        events: [
          {
            type: 'row_added',
            rowId: 'row-3',
            payload: { rowName: 'Wolf', initiative: 14 },
          },
          {
            type: 'roll',
            rowId: null,
            payload: { kind: 'dice', total: 9, dice: '2d6' },
          },
        ],
      }),
    )

    expect(result).toEqual({ logged: 2 })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
      {
        encounterId: 7,
        rowId: 'row-3',
        round: 3,
        type: 'row_added',
        payload: { rowName: 'Wolf', initiative: 14 },
        createdBy: 'user-1',
        actorName: null,
      },
      {
        encounterId: 7,
        rowId: null,
        round: 3,
        type: 'roll',
        payload: { kind: 'dice', total: 9, dice: '2d6' },
        createdBy: 'user-1',
        actorName: null,
      },
    ])
    expect(supabase.channel('sheet:7').httpSend).toHaveBeenCalledWith(
      'events',
      {},
    )
  })

  it.each([
    [
      'an event type the client may not log',
      { type: 'hp', rowId: 'r', payload: {} },
    ],
    [
      'an unknown payload field',
      { type: 'turn', rowId: 'r', payload: { rowName: 'A', hp: 3 } },
    ],
    [
      'a turn without a row',
      { type: 'turn', rowId: null, payload: { rowName: 'A' } },
    ],
  ])('rejects %s', async (_label, invalid) => {
    await expect(
      handler(postEvent({ events: [invalid] })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it.each(['readied', 'ready_used', 'hidden', 'revealed'])(
    'accepts a %s event',
    async type => {
      mockFrom({
        initiative_sheets: [
          access,
          mockChain({ data: { round: 1 }, error: null }),
        ],
        combat_events: mockChain({ data: null, error: null }),
      })

      await expect(
        handler(
          postEvent({
            events: [{ type, rowId: 'row-1', payload: { rowName: 'Elara' } }],
          }),
        ),
      ).resolves.toEqual({ logged: 1 })
    },
  )

  it('rejects an empty list of events', async () => {
    await expect(handler(postEvent({ events: [] }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(
      handler(
        postEvent({
          events: [{ type: 'turn', rowId: 'r', payload: { rowName: 'A' } }],
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(postEvent({ events: [] }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})
