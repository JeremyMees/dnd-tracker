import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/patch-rows.post'

const goblin: InitiativeSheetRow = {
  id: 'goblin',
  index: 0,
  initiative: 12,
  name: 'Goblin',
  type: 'monster',
  conditions: [],
  hitPoints: 7,
  maxHitPoints: 7,
}

const orc: InitiativeSheetRow = {
  ...goblin,
  id: 'orc',
  index: 1,
  name: 'Orc',
  hitPoints: 15,
  maxHitPoints: 15,
}

const access = () =>
  mockChain({
    data: { id: 7, campaign: null, createdBy: 'user-1' },
    error: null,
  })

const sheetRead = (rows: InitiativeSheetRow[]) =>
  mockChain({ data: { round: 3, rows }, error: null })

const fullSheet = (rows: InitiativeSheetRow[]) =>
  mockChain({
    data: {
      id: 7,
      title: 'Ambush',
      round: 3,
      activeIndex: 0,
      rows,
      settings: {},
      info: null,
      infoCards: [],
    },
    error: null,
  })

function patchEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/patch-rows',
    params: { id: '7' },
    body,
  })
}

const patches = [
  { rowId: 'goblin', patch: { hitPoints: 0 } },
  { rowId: 'orc', patch: { hitPoints: 8 } },
]

describe('POST /api/encounter/[id]/patch-rows', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('patches every row in one call and logs an event per change', async () => {
    const after = [
      { ...goblin, hitPoints: 0 },
      { ...orc, hitPoints: 8 },
    ]
    const combatEvents = mockChain({ data: null, error: null })

    mockFrom(
      {
        initiative_sheets: [
          access(),
          sheetRead([goblin, orc]),
          fullSheet(after),
        ],
        combat_events: combatEvents,
        live_sessions: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: after, error: null }),
          mockChain({ data: 4, error: null }),
        ],
      },
    )

    const result = await handler(patchEvent({ patches }))

    expect(result).toEqual({ rows: after })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_actions', {
      p_encounter: 7,
      p_patches: { goblin: { hitPoints: 0 }, orc: { hitPoints: 8 } },
    })
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      'apply_live_action',
      expect.anything(),
    )
    expect(combatEvents.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ rowId: 'goblin', type: 'hp', round: 3 }),
        expect.objectContaining({ rowId: 'orc', type: 'hp', round: 3 }),
      ]),
    )
  })

  it('sends one sync to the sheet channel and one to the live session', async () => {
    const after = [
      { ...goblin, hitPoints: 0 },
      { ...orc, hitPoints: 8 },
    ]

    mockFrom(
      {
        initiative_sheets: [
          access(),
          sheetRead([goblin, orc]),
          fullSheet(after),
          fullSheet(after),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      {
        rpc: [
          mockChain({ data: after, error: null }),
          mockChain({ data: 4, error: null }),
          mockChain({ data: 9, error: null }),
        ],
      },
    )

    await handler(patchEvent({ patches }))

    const supabase = serverSupabaseServiceRole({} as never)
    const sheetSend = supabase.channel('sheet:7').httpSend
    const liveSend = supabase.channel('live:session-uuid').httpSend

    expect(sheetSend).toHaveBeenCalledWith('sync', expect.any(Object))
    expect(sheetSend).not.toHaveBeenCalledWith('action', expect.anything())
    expect(liveSend).toHaveBeenCalledWith('sync', expect.any(Object))
  })

  it('skips the live session when only DM notes change', async () => {
    const from = mockFrom(
      {
        initiative_sheets: [
          access(),
          sheetRead([goblin, orc]),
          fullSheet([goblin, orc]),
        ],
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: [goblin, orc], error: null }),
          mockChain({ data: 4, error: null }),
        ],
      },
    )

    await handler(
      patchEvent({
        patches: [
          { rowId: 'goblin', patch: { note: 'Fled' } },
          { rowId: 'orc', patch: { note: 'Enraged' } },
        ],
      }),
    )

    expect(from).not.toHaveBeenCalledWith('live_sessions')
  })

  it('throws a 404 when a row is not on the sheet', async () => {
    mockFrom({
      initiative_sheets: [access(), sheetRead([goblin])],
    })

    await expect(handler(patchEvent({ patches }))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Row not found',
    })

    expect(serverSupabaseServiceRole({} as never).rpc).toBeUndefined()
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(handler(patchEvent({ patches }))).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it.each([
    ['no patches', { patches: [] }],
    [
      'the same row twice',
      {
        patches: [
          { rowId: 'goblin', patch: { hitPoints: 1 } },
          { rowId: 'goblin', patch: { hitPoints: 2 } },
        ],
      },
    ],
    [
      'hiding a row',
      { patches: [{ rowId: 'goblin', patch: { hidden: true } }] },
    ],
    [
      'an unknown field',
      { patches: [{ rowId: 'goblin', patch: { type: 'player' } }] },
    ],
  ])('rejects %s', async (_label, body) => {
    await expect(handler(patchEvent(body))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
