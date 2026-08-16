import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import handler from '~~/server/api/stats.get'

const TABLES = [
  'campaigns',
  'homebrew_items',
  'initiative_sheets',
  'notes',
  'profiles',
  'team',
]

function eventWithAuth(header?: string) {
  return mockEvent({
    method: 'GET',
    headers: header ? { authorization: header } : {},
  })
}

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig({ trmnl: 'trmnl-secret' })
  })

  it('returns the highest id per table for an authorized request', async () => {
    mockFrom(
      Object.fromEntries(
        TABLES.map(table => [
          table,
          mockChain({ data: [{ id: 5 }], count: 5, error: null }),
        ]),
      ),
    )

    await expect(
      handler(eventWithAuth('Bearer trmnl-secret')),
    ).resolves.toEqual(Object.fromEntries(TABLES.map(table => [table, 5])))
  })

  it('falls back to the count when no row id is present', async () => {
    mockFrom(
      Object.fromEntries(
        TABLES.map(table => [
          table,
          mockChain({ data: [], count: 3, error: null }),
        ]),
      ),
    )

    const result = (await handler(
      eventWithAuth('Bearer trmnl-secret'),
    )) as Record<string, number>

    expect(result.campaigns).toBe(3)
  })

  it('defaults a table to 0 when the query errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFrom({
      ...Object.fromEntries(
        TABLES.filter(t => t !== 'notes').map(table => [
          table,
          mockChain({ data: [{ id: 5 }], count: 5, error: null }),
        ]),
      ),
      notes: mockChain({ data: null, count: null, error: { message: 'boom' } }),
    })

    const result = (await handler(
      eventWithAuth('Bearer trmnl-secret'),
    )) as Record<string, number>

    expect(result.notes).toBe(0)
  })

  it('throws a 401 for a missing or incorrect auth header', async () => {
    await expect(handler(eventWithAuth('Bearer wrong'))).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  })
})
