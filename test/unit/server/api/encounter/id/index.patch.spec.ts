import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
import handler from '~~/server/api/encounter/[id]/index.patch'

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
}

const goblin: InitiativeSheetRow = {
  ...row,
  id: 'row-2',
  name: 'Goblin',
  type: 'monster',
}

function updateEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'PATCH',
    path: '/api/encounter/7',
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

describe('PATCH /api/encounter/[id]', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('applies the update as the DM', async () => {
    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [row, goblin] }))

    await expect(handler(updateEvent({ rows: [row] }))).resolves.toEqual({
      updated: true,
    })

    expect(state.sheet.rows).toEqual([row])
    expect(state.events).toEqual([
      expect.objectContaining({ type: 'row_removed', createdBy: 'user-1' }),
    ])
  })

  it('drops null condition fields before they reach the rows check constraint', async () => {
    const stored = { id: 'prone', name: 'Prone', desc: 'On the ground.' }

    mockAccess()
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    await handler(
      updateEvent({
        rows: [
          {
            ...row,
            conditions: [{ ...stored, level: null, hasLevels: null }],
          },
        ],
      }),
    )

    expect(state.sheet.rows[0]?.conditions).toEqual([{ ...stored, desc: '' }])
  })

  it('accepts settings, info and info cards', async () => {
    mockAccess()
    const { state } = useMemorySheet(storedSheet())
    const settings = { spacing: 'compact', modified: true }

    await handler(
      updateEvent({ settings, info: 'Ambush at dawn', infoCards: [] }),
    )

    expect(state.sheet).toMatchObject({
      settings,
      info: 'Ambush at dawn',
      infoCards: [],
    })
  })

  it.each([
    ['an unknown field', { title: 'Renamed' }],
    ['the owner', { createdBy: 'someone-else' }],
    ['a row without an id', { rows: [{ name: 'Elara', conditions: [] }] }],
    ['a negative active index', { activeIndex: -1 }],
    [
      'too many info cards',
      { infoCards: Array(11).fill({ id: 'a', name: 'A' }) },
    ],
  ])('rejects %s', async (_label, body) => {
    await expect(handler(updateEvent(body))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(updateEvent({ round: 2 }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws a 403 and changes nothing when the user has no access to the encounter', async () => {
    mockAccess('someone-else')
    const { state } = useMemorySheet(storedSheet({ rows: [row] }))

    await expect(handler(updateEvent({ round: 2 }))).rejects.toMatchObject({
      statusCode: 403,
    })

    expect(state.sheet.round).toBe(1)
  })
})
