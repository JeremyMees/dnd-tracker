import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/live/summary.post'

const sheet = {
  id: 7,
  campaign: null,
  createdBy: 'user-1',
  title: 'Ambush',
  round: 4,
  activeIndex: 0,
  rows: [
    {
      id: 'row-1',
      index: 0,
      initiative: 12,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 4,
      maxHitPoints: 20,
    },
    {
      id: 'row-2',
      index: 1,
      initiative: 8,
      name: 'Gundren the Cruel',
      type: 'monster',
      conditions: [],
      hitPoints: 0,
      maxHitPoints: 30,
    },
  ],
  settings: { spacing: 'normal', modified: false },
} as unknown as InitiativeSheet

const combatEvents = [
  {
    rowId: 'row-1',
    round: 1,
    type: 'hp',
    payload: {
      rowName: 'Elara',
      kind: 'damage',
      amount: 16,
      before: 20,
      after: 4,
    },
  },
  {
    rowId: 'row-2',
    round: 2,
    type: 'hp',
    payload: {
      rowName: 'Gundren the Cruel',
      kind: 'damage',
      amount: 30,
      before: 30,
      after: 0,
    },
  },
]

function mockAll(
  overrides: {
    sheet?: unknown
    session?: unknown
    events?: unknown
  } = {},
) {
  mockFrom({
    initiative_sheets: mockChain({
      data: 'sheet' in overrides ? overrides.sheet : sheet,
      error: null,
    }),
    live_sessions: mockChain({
      data:
        'session' in overrides ? overrides.session : { uuid: 'session-uuid' },
      error: null,
    }),
    combat_events: mockChain({
      data: 'events' in overrides ? overrides.events : combatEvents,
      error: null,
    }),
  })
}

function request() {
  return mockEvent({ method: 'POST', body: { encounter: 7 } })
}

describe('POST /api/encounter/live/summary', () => {
  beforeEach(() => {
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('broadcasts the aggregated stats to the live channel', async () => {
    mockAll()

    await expect(handler(request())).resolves.toEqual({ shared: true })

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')
    const [event, payload] = channel.httpSend.mock.calls[0] as [
      string,
      { stats: CombatStats },
    ]

    expect(event).toBe('summary')
    expect(payload.stats.rounds).toBe(4)
    expect(payload.stats.damageTaken).toBe(46)
    expect(payload.stats.combatants).toHaveLength(2)
  })

  it('broadcasts without a version so it cannot desync clients', async () => {
    mockAll()

    await handler(request())

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')
    const [, payload] = channel.httpSend.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]

    expect(Object.keys(payload)).toEqual(['stats'])
  })

  it('masks monster names when hideMonsterNames is on', async () => {
    mockAll({
      sheet: {
        ...sheet,
        settings: { ...sheet.settings, live: { hideMonsterNames: true } },
      },
    })

    await handler(request())

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')
    const [, payload] = channel.httpSend.mock.calls[0] as [
      string,
      { stats: CombatStats },
    ]
    const names = payload.stats.combatants.map(c => c.name)

    expect(names).toContain('Monster 1')
    expect(names).not.toContain('Gundren the Cruel')
  })

  it('drops events for rows that are no longer on the sheet', async () => {
    mockAll({
      events: [
        ...combatEvents,
        {
          rowId: 'deleted-row',
          round: 1,
          type: 'hp',
          payload: {
            rowName: 'Secret Boss',
            kind: 'damage',
            amount: 99,
            before: 99,
            after: 0,
          },
        },
      ],
    })

    await handler(request())

    const supabase = serverSupabaseServiceRole({} as never)
    const channel = supabase.channel('live:session-uuid')
    const [, payload] = channel.httpSend.mock.calls[0] as [
      string,
      { stats: CombatStats },
    ]

    expect(payload.stats.combatants).toHaveLength(2)
    expect(payload.stats.damageTaken).toBe(46)
    expect(payload.stats.combatants.map(c => c.name)).not.toContain(
      'Secret Boss',
    )
  })

  it('returns shared: false when there is no active session', async () => {
    mockAll({ session: null })

    await expect(handler(request())).resolves.toEqual({ shared: false })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockAll({ sheet: null })

    await expect(handler(request())).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws a 403 when the caller has no access', async () => {
    mockAll({ sheet: { ...sheet, createdBy: 'user-2' } })

    await expect(handler(request())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: -1 } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
