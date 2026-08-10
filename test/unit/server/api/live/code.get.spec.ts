import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/live/code.get'

const future = new Date(Date.now() + 60_000).toISOString()

const session = {
  code: 'ABC234',
  encounter: 7,
  expiresAt: future,
  endedAt: null,
  seats: [],
}

const sheet = {
  id: 7,
  title: 'Ambush',
  round: 1,
  activeIndex: 0,
  settings: {},
  rows: [
    {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 20,
      maxHitPoints: 20,
    },
    {
      id: 'row-2',
      index: 1,
      initiative: 8,
      name: 'Goblin',
      type: 'monster',
      conditions: [],
      hitPoints: 7,
      maxHitPoints: 7,
    },
    {
      id: 'row-3',
      index: 2,
      initiative: 12,
      name: 'Ally',
      type: 'npc',
      conditions: [],
      hitPoints: 15,
      maxHitPoints: 15,
    },
  ],
}

function eventWithCode(code: string) {
  return mockEvent({
    method: 'GET',
    path: `/?code=${encodeURIComponent(code)}`,
  })
}

describe('GET /api/live/code', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the code, expiry and claimable player/npc rows for an active session', async () => {
    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    await expect(handler(eventWithCode('abc234'))).resolves.toEqual({
      code: 'ABC234',
      expiresAt: future,
      rows: [
        { id: 'row-1', name: 'Elara', type: 'player' },
        { id: 'row-3', name: 'Ally', type: 'npc' },
      ],
    })
  })

  it('excludes monster rows even when unclaimed', async () => {
    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    const result = await handler(eventWithCode('ABC234'))

    expect(result.rows.some(row => row.type === 'monster')).toBe(false)
  })

  it('excludes rows already claimed by another seat', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: {
          ...session,
          seats: [
            { seat: 's1', row: 'row-1', name: 'Bilbo', spectator: false },
          ],
        },
        error: null,
      }),
      initiative_sheets: mockChain({ data: sheet, error: null }),
    })

    await expect(handler(eventWithCode('ABC234'))).resolves.toMatchObject({
      rows: [{ id: 'row-3', name: 'Ally', type: 'npc' }],
    })
  })

  it('throws a 400 when no code is provided', async () => {
    await expect(
      handler(mockEvent({ method: 'GET', path: '/' })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Code not provided',
    })
  })

  it('throws a 400 when the code is not 6 characters', async () => {
    await expect(handler(eventWithCode('short'))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Code not provided',
    })
  })

  it('throws a 404 when the room code does not exist', async () => {
    mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

    await expect(handler(eventWithCode('ZZZZZZ'))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it('throws a 410 when the session has ended', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: { ...session, endedAt: new Date().toISOString() },
        error: null,
      }),
    })

    await expect(handler(eventWithCode('ABC234'))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 410 when the session has expired', async () => {
    mockFrom({
      live_sessions: mockChain({
        data: {
          ...session,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
        error: null,
      }),
    })

    await expect(handler(eventWithCode('ABC234'))).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it('throws a 404 when the encounter no longer exists', async () => {
    mockFrom({
      live_sessions: mockChain({ data: session, error: null }),
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(handler(eventWithCode('ABC234'))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Encounter not found',
    })
  })
})
