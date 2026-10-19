import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
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

describe('POST /api/encounter/[id]/turn', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('advances the turn of an encounter the user can access', async () => {
    const updated = {
      id: 7,
      title: 'Ambush',
      round: 3,
      activeIndex: 1,
      rows: [goblin, elara],
      settings: {},
    }

    const updateChain = mockChain({ data: updated, error: null })

    mockFrom(
      {
        initiative_sheets: [
          mockChain({
            data: { id: 7, campaign: null, createdBy: 'user-1' },
            error: null,
          }),
          mockChain({
            data: { activeIndex: 0, round: 3, rows: [goblin, elara] },
            error: null,
          }),
          updateChain,
        ],
        live_sessions: mockChain({ data: null, error: null }),
      },
      { rpc: mockChain({ data: 2, error: null }) },
    )

    const result = await handler(turnEvent())

    expect(result).toEqual({
      sheet: updated,
      expired: [],
      saves: [],
      recharges: [],
    })
    expect(updateChain.update).toHaveBeenCalledWith({
      activeIndex: 1,
      round: 3,
    })
  })

  it('rejects users without access to the encounter', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { id: 7, campaign: null, createdBy: 'someone-else' },
        error: null,
      }),
    })

    await expect(handler(turnEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('rejects when the encounter cannot be read', async () => {
    mockFrom({
      initiative_sheets: [
        mockChain({
          data: { id: 7, campaign: null, createdBy: 'user-1' },
          error: null,
        }),
        mockChain({
          data: null,
          error: { code: 'PGRST116', message: 'not found' },
        }),
      ],
    })

    await expect(handler(turnEvent())).rejects.toBeTruthy()
  })
})
