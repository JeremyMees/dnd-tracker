import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
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

function mockAccess(createdBy = 'user-1') {
  mockFrom({
    initiative_sheets: mockChain({
      data: { id: 7, campaign: null, createdBy },
      error: null,
    }),
  })
}

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

  it('applies every patch as the DM and returns the stored rows', async () => {
    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [goblin, orc] }))

    const result = await handler(patchEvent({ patches }))

    const rows = [
      { ...goblin, hitPoints: 0 },
      { ...orc, hitPoints: 8 },
    ]

    expect(result).toEqual({ rows })
    expect(state.sheet.rows).toEqual(rows)
    expect(state.events).toEqual([
      expect.objectContaining({ rowId: 'goblin', createdBy: 'user-1' }),
      expect.objectContaining({ rowId: 'orc', createdBy: 'user-1' }),
    ])
  })

  it('reveals several hidden rows in one request', async () => {
    mockAccess()
    const { state } = useMemorySheet(
      storedSheet({
        rows: [
          { ...goblin, hidden: true },
          { ...orc, hidden: true },
        ],
      }),
    )

    await handler(
      patchEvent({
        patches: [
          { rowId: 'goblin', patch: { hidden: false } },
          { rowId: 'orc', patch: { hidden: false } },
        ],
      }),
    )

    expect(state.sheet.rows).toEqual([
      { ...goblin, hidden: false },
      { ...orc, hidden: false },
    ])
  })

  it('refuses to hide a row a player has claimed', async () => {
    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [goblin, orc] }), {
      liveSession: {
        uuid: 'session-uuid',
        seats: [
          { seat: 'seat-1', row: 'goblin', name: 'Gob', spectator: false },
        ],
      },
    })

    await expect(
      handler(
        patchEvent({
          patches: [
            { rowId: 'goblin', patch: { hidden: true } },
            { rowId: 'orc', patch: { hidden: true } },
          ],
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 409, statusMessage: 'row-claimed' })

    expect(state.sheet.rows).toEqual([goblin, orc])
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockAccess('someone-else')
    const { state } = useMemorySheet(storedSheet({ rows: [goblin, orc] }))

    await expect(handler(patchEvent({ patches }))).rejects.toMatchObject({
      statusCode: 403,
    })

    expect(state.sheet.rows).toEqual([goblin, orc])
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
