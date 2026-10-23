import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
import handler from '~~/server/api/encounter/[id]/turn.post'

const goblin: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 15,
  name: 'Goblin',
  type: 'monster',
  conditions: [],
}

const elara: InitiativeSheetRow = { ...goblin, id: 'row-2', name: 'Elara' }

function turnEvent() {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/turn',
    params: { id: '7' },
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

describe('POST /api/encounter/[id]/turn', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('advances the turn as the DM and returns the stored sheet', async () => {
    mockAccess()
    const { state } = useMemorySheet(
      storedSheet({ round: 3, rows: [goblin, elara] }),
    )

    const result = await handler(turnEvent())

    expect(result).toEqual({
      sheet: expect.objectContaining({ activeIndex: 1, round: 3 }),
      expired: [],
      saves: [],
      recharges: [],
    })
    expect(state.events).toEqual([
      expect.objectContaining({ type: 'turn', createdBy: 'user-1' }),
    ])
  })

  it('rejects users without access and leaves the turn alone', async () => {
    mockAccess('someone-else')
    const { state } = useMemorySheet(storedSheet({ rows: [goblin, elara] }))

    await expect(handler(turnEvent())).rejects.toMatchObject({
      statusCode: 403,
    })

    expect(state.sheet.activeIndex).toBe(0)
  })
})
