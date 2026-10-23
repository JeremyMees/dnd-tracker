import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
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

function mockAccess(createdBy = 'user-1') {
  mockFrom({
    initiative_sheets: mockChain({
      data: { id: 7, campaign: null, createdBy },
      error: null,
    }),
  })
}

describe('POST /api/encounter/[id]/patch-row', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('applies the patch as the DM and returns the stored row', async () => {
    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    const result = await handler(
      patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } }),
    )

    expect(result).toEqual({ row: { ...row, hitPoints: 6 } })
    expect(state.events).toEqual([
      expect.objectContaining({ type: 'hp', createdBy: 'user-1' }),
    ])
    expect(state.messages).toEqual([
      expect.objectContaining({ topic: 'sheet:7', event: 'action' }),
    ])
  })

  it.each([
    [{ name: 'A' }],
    [{ name: 'A'.repeat(51) }],
    [{ note: 'A'.repeat(251) }],
    [{ resources: { spellSlots: 3 } }],
    [{ type: 'monster' }],
  ])('rejects the patch %o', async patch => {
    await expect(
      handler(patchEvent({ rowId: 'row-1', patch })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('drops null condition fields before they reach the rows check constraint', async () => {
    const stored = { id: 'prone', name: 'Prone', desc: 'On the ground.' }

    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    await handler(
      patchEvent({
        rowId: 'row-1',
        patch: {
          conditions: [{ ...stored, level: null, hasLevels: null }],
        },
      }),
    )

    expect(state.sheet.rows[0]?.conditions).toEqual([{ ...stored, desc: '' }])
  })

  it('passes resource uses through to the row', async () => {
    const resources = {
      legendaryActions: 2,
      reaction: true,
      actions: { 'Fire Breath': 1 },
    }

    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    await handler(patchEvent({ rowId: 'row-1', patch: { resources } }))

    expect(state.sheet.rows[0]?.resources).toEqual(resources)
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

  it('throws a 403 and changes nothing when the user has no access to the encounter', async () => {
    mockAccess('someone-else')
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    await expect(
      handler(patchEvent({ rowId: 'row-1', patch: { hitPoints: 6 } })),
    ).rejects.toMatchObject({ statusCode: 403 })

    expect(state.sheet.rows).toEqual([row])
  })
})
