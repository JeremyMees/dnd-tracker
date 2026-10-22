import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { toPlayerSheet } from '~~/server/utils/player-portal'
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
        live_sessions: mockChain({ data: null, error: null }),
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

  it('pushes the patched sheet to an active live session', async () => {
    const sheet = {
      id: 7,
      title: 'Ambush',
      round: 2,
      activeIndex: 0,
      rows: [row],
      settings: { spacing: 'normal', modified: false },
    }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: sheet, error: null }),
          mockChain({
            data: { ...sheet, rows: [{ ...row, hitPoints: 6 }] },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, hitPoints: 6 }, error: null }),
          mockChain({ data: 5, error: null }),
          mockChain({ data: 9, error: null }),
        ],
      },
    )

    await handler(patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } }))

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('increment_live_version', {
      p_session: 'session-uuid',
    })
    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'sync',
      {
        version: 9,
        sheet: toPlayerSheet({
          ...sheet,
          rows: [{ ...row, hitPoints: 6 }],
        } as unknown as InitiativeSheet),
      },
    )
  })

  it('masks a row in the live sheet once it is hidden and logs it', async () => {
    const goblin = { ...row, id: 'row-2', name: 'Goblin', type: 'monster' }
    const sheet = {
      id: 7,
      title: 'Ambush',
      round: 2,
      activeIndex: 0,
      rows: [row, goblin],
      settings: { spacing: 'normal', modified: false },
    }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: sheet, error: null }),
          mockChain({
            data: { ...sheet, rows: [row, { ...goblin, hidden: true }] },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid', seats: [] },
          error: null,
        }),
      },
      {
        rpc: [
          mockChain({ data: { ...goblin, hidden: true }, error: null }),
          mockChain({ data: 5, error: null }),
          mockChain({ data: 9, error: null }),
        ],
      },
    )

    await handler(patchEvent({ rowId: 'row-2', patch: { hidden: true } }))

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'hidden',
        payload: { rowName: 'Goblin' },
      }),
    ])
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'sync',
      {
        version: 9,
        sheet: expect.objectContaining({
          rows: [
            expect.objectContaining({ id: 'row-1', name: 'Elara' }),
            expect.objectContaining({ id: 'row-2', name: '???', hidden: true }),
          ],
        }),
      },
    )
  })

  it('refuses to hide a row a player has claimed', async () => {
    mockFrom({
      initiative_sheets: [
        mockChain({
          data: { id: 7, campaign: null, createdBy: 'user-1' },
          error: null,
        }),
        mockChain({ data: { rows: [row], round: 2 }, error: null }),
      ],
      live_sessions: mockChain({
        data: {
          uuid: 'session-uuid',
          seats: [{ seat: 'seat-1', row: 'row-1' }],
        },
        error: null,
      }),
    })

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hidden: true } })),
    ).rejects.toMatchObject({ statusCode: 409, statusMessage: 'row-claimed' })
  })

  it('still reveals a claimed row', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({
            data: { rows: [{ ...row, hidden: true }], round: 2 },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, hidden: false }, error: null }),
          mockChain({ data: 5, error: null }),
        ],
      },
    )

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hidden: false } })),
    ).resolves.toEqual({ row: { ...row, hidden: false } })
  })

  it('renames a row and pushes the change to an active live session', async () => {
    const sheet = { round: 2, rows: [row] }
    const renamed = { ...row, name: 'Elara Moonwhisper' }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: sheet, error: null }),
          mockChain({
            data: {
              id: 7,
              title: 'Ambush',
              round: 2,
              activeIndex: 0,
              rows: [renamed],
              settings: {},
            },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid' },
          error: null,
        }),
      },
      { rpc: mockChain({ data: renamed, error: null }) },
    )

    await handler(
      patchEvent({ rowId: 'row-1', patch: { name: 'Elara Moonwhisper' } }),
    )

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { name: 'Elara Moonwhisper' },
    })
    expect(supabase.channel('live:session-uuid').httpSend).toHaveBeenCalledWith(
      'sync',
      expect.objectContaining({
        sheet: expect.objectContaining({
          rows: [expect.objectContaining({ name: 'Elara Moonwhisper' })],
        }),
      }),
    )
  })

  it('does not sync the live session for a note-only patch', async () => {
    const from = mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: { round: 2, rows: [row] }, error: null }),
        ],
        combat_events: mockChain({ data: null, error: null }),
      },
      { rpc: mockChain({ data: { ...row, note: 'Flanking' }, error: null }) },
    )

    await handler(patchEvent({ rowId: 'row-1', patch: { note: 'Flanking' } }))

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { note: 'Flanking' },
    })
    expect(from).not.toHaveBeenCalledWith('live_sessions')
    expect(supabase.channel('sheet:7').httpSend).toHaveBeenCalledWith(
      'action',
      expect.objectContaining({ row: 'row-1', patch: { note: 'Flanking' } }),
    )
  })

  it.each([
    [{ name: 'A' }],
    [{ name: 'A'.repeat(51) }],
    [{ note: 'A'.repeat(251) }],
  ])('rejects an out-of-range patch %o', async patch => {
    await expect(
      handler(patchEvent({ rowId: 'row-1', patch })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
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

  it('drops null condition fields before they reach the rows check constraint', async () => {
    const stored = { id: 'prone', name: 'Prone', desc: 'On the ground.' }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({
            data: { rows: [row], round: 1 },
            error: null,
          }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, conditions: [stored] }, error: null }),
          mockChain({ data: 2, error: null }),
        ],
      },
    )

    await handler(
      patchEvent({
        rowId: 'row-1',
        patch: {
          conditions: [{ ...stored, level: null, hasLevels: null }],
        },
      }),
    )

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { conditions: [{ ...stored, desc: '' }] },
    })
  })

  it('passes resource uses through to the row', async () => {
    const resources = {
      legendaryActions: 2,
      reaction: true,
      actions: { 'Fire Breath': 1 },
    }

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: { rows: [row], round: 2 }, error: null }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, resources }, error: null }),
          mockChain({ data: 5, error: null }),
        ],
      },
    )

    await handler(patchEvent({ rowId: 'row-1', patch: { resources } }))

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { resources },
    })
  })

  it('readies an action for a row and logs it', async () => {
    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({ data: { rows: [row], round: 2 }, error: null }),
        ],
        combat_events: mockChain({ data: null, error: null }),
        live_sessions: mockChain({ data: null, error: null }),
      },
      {
        rpc: [
          mockChain({ data: { ...row, readied: true }, error: null }),
          mockChain({ data: 5, error: null }),
        ],
      },
    )

    await handler(patchEvent({ rowId: 'row-1', patch: { readied: true } }))

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('apply_live_action', {
      p_encounter: 7,
      p_row_id: 'row-1',
      p_patch: { readied: true },
    })
    expect(supabase.from('combat_events').insert).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'readied',
        payload: { rowName: 'Elara' },
      }),
    ])
  })

  it('rejects an unknown resource field', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    await expect(
      handler(
        patchEvent({ rowId: 'row-1', patch: { resources: { spellSlots: 3 } } }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an unrecognized patch field', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'user-1' },
        error: null,
      }),
    })

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { type: 'monster' } })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
