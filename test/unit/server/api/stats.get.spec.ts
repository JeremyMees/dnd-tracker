import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import type { SupabaseChain } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import handler from '~~/server/api/stats.get'

const TABLES = [
  'campaigns',
  'homebrew_items',
  'initiative_sheets',
  'live_sessions',
  'notes',
  'profiles',
  'team',
]

type Result = Record<string, unknown>

function mockStats({
  latest = { data: [{ id: 5 }], count: 5, error: null },
  perTable = {},
  currentlyLive = { count: 2, error: null },
  proProfiles = { count: 4, error: null },
  sheets = { data: [{ rows: [1, 2, 3] }, { rows: [4] }], error: null },
}: {
  latest?: Result
  perTable?: Record<string, Result>
  currentlyLive?: Result
  proProfiles?: Result
  sheets?: Result
} = {}) {
  const tables: Record<string, SupabaseChain[]> = {}

  for (const table of TABLES) {
    tables[table] = [mockChain(perTable[table] ?? latest)]
  }

  tables.live_sessions!.push(mockChain(currentlyLive))
  tables.profiles!.push(mockChain(proProfiles))
  tables.initiative_sheets!.push(mockChain(sheets))

  return mockFrom(tables)
}

function authed(header = 'Bearer trmnl-secret') {
  return mockEvent({ method: 'GET', headers: { authorization: header } })
}

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ trmnl: 'trmnl-secret' })
  })

  it('returns the highest id per table plus the aggregate counts', async () => {
    mockStats()

    await expect(handler(authed())).resolves.toEqual({
      ...Object.fromEntries(TABLES.map(table => [table, 5])),
      currentlyLive: 2,
      proSubscribers: 4,
      combatantsTracked: 4,
    })
  })

  it('falls back to the count when no row id is present', async () => {
    mockStats({ latest: { data: [], count: 3, error: null } })

    const result = (await handler(authed())) as Record<string, number>

    expect(result.campaigns).toBe(3)
  })

  it('falls back to the count when the row id is not a number', async () => {
    mockStats({ latest: { data: [{ id: 'abc' }], count: 7, error: null } })

    const result = (await handler(authed())) as Record<string, number>

    expect(result.campaigns).toBe(7)
  })

  it('defaults a table to 0 when the query errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStats({
      perTable: {
        notes: { data: null, count: null, error: { message: 'boom' } },
      },
    })

    const result = (await handler(authed())) as Record<string, number>

    expect(result.notes).toBe(0)
    expect(result.campaigns).toBe(5)
  })

  it('defaults the aggregate counts to 0 when their queries error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStats({
      currentlyLive: { count: null, error: { message: 'boom' } },
      proProfiles: { count: null, error: { message: 'boom' } },
      sheets: { data: null, error: { message: 'boom' } },
    })

    const result = (await handler(authed())) as Record<string, number>

    expect(result.currentlyLive).toBe(0)
    expect(result.proSubscribers).toBe(0)
    expect(result.combatantsTracked).toBe(0)
  })

  it('ignores sheets whose rows are not an array', async () => {
    mockStats({
      sheets: {
        data: [{ rows: null }, { rows: [1, 2] }, { rows: 'nope' }],
        error: null,
      },
    })

    const result = (await handler(authed())) as Record<string, number>

    expect(result.combatantsTracked).toBe(2)
  })

  it('throws a 401 for an incorrect auth header', async () => {
    await expect(handler(authed('Bearer wrong'))).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  })

  it('throws a 401 when the auth header is missing', async () => {
    await expect(
      handler(mockEvent({ method: 'GET', headers: {} })),
    ).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  })
})
