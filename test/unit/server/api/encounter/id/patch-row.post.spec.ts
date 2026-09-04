import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/encounter/[id]/patch-row.post'

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
}

function patchEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/patch-row',
    params: { id: '7' },
    body,
  })
}

describe('POST /api/encounter/[id]/patch-row', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('patches the row, logs a combat event, and broadcasts to the sheet channel', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({
            data: { rows: [row], round: 2 },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, hitPoints: 6 }, error: null }),
          mockChain({ data: 5, error: null }),
        ],
      },
    )

    const result = await handler(
      patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } }),
    )

    expect(result).toEqual({ row: { ...row, hitPoints: 6 } })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { hitPoints: 6 },
    })

    expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
      {
        encounterId: 7,
        rowId: 'row-1',
        round: 2,
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'damage',
          amount: 4,
          before: 10,
          after: 6,
        },
        createdBy: 'user-1',
        actorName: null,
      },
    ])

    const channel = supabase.channel('sheet:7')

    expect(channel.httpSend).toHaveBeenCalledWith('action', {
      version: 5,
      row: 'row-1',
      patch: { hitPoints: 6 },
    })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } })),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 404 when the row does not exist on the sheet', async () => {
    mockFrom({
      initiative_sheets: [
        mockChain({
          data: { id: 7, campaign: null, createdBy: 'user-1' },
          error: null,
        }),
        mockChain({ data: { rows: [], round: 1 }, error: null }),
      ],
    })

    await expect(
      handler(patchEvent({ rowId: 'missing-row', patch: { hitPoints: 6 } })),
    ).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Row not found' })
  })

  it('rejects an unrecognized patch field', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { name: 'Hacked' } })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
