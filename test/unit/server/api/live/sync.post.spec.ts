import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import { toPlayerSheet } from '~~/server/utils/player-portal'
import handler from '~~/server/api/live/sync.post'

const future = new Date(Date.now() + 60_000).toISOString()

const sheet = {
  id: 7,
  campaign: null,
  createdBy: 'user-1',
  title: 'Ambush',
  round: 2,
  activeIndex: 1,
  rows: [
    {
      id: 'row-1',
      index: 0,
      initiative: 12,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 10,
      maxHitPoints: 20,
    },
  ],
  settings: { spacing: 'normal', modified: false },
} as unknown as InitiativeSheet

describe('POST /api/live/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('broadcasts the sanitized sheet and increments the version', async () => {
    mockFrom(
      {
        initiative_sheets: mockChain({ data: sheet, error: null }),
        live_sessions: mockChain({
          data: { uuid: 'session-uuid', expiresAt: future },
          error: null,
        }),
      },
      { rpc: mockChain({ data: 5, error: null }) },
    )

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).resolves.toEqual({ synced: true })

    const supabase = serverSupabaseServiceRole({} as never)

    expect(supabase.rpc).toHaveBeenCalledWith('increment_live_version', {
      p_session: 'session-uuid',
    })
    expect(supabase.channel).toHaveBeenCalledWith('live:session-uuid')

    const channel = supabase.channel('live:session-uuid')

    expect(channel.httpSend).toHaveBeenCalledWith('sync', {
      version: 5,
      sheet: toPlayerSheet(sheet),
    })
  })

  it('returns synced: false when there is no active session', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: sheet, error: null }),
      live_sessions: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).resolves.toEqual({ synced: false })
  })

  it('throws a 404 when the encounter does not exist', async () => {
    mockFrom({
      initiative_sheets: mockChain({ data: null, error: null }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Encounter not found',
    })
  })

  it('throws a 403 when the caller has no access', async () => {
    mockFrom({
      initiative_sheets: mockChain({
        data: { ...sheet, createdBy: 'user-2' },
        error: null,
      }),
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: { encounter: 7 } })),
    ).rejects.toMatchObject({ statusCode: 403 })
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
