import { describe, expect, it } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import type { SupabaseChain } from '~~/test/unit/stubs/supabase'
import { dndConditionFixture } from '~~/test/fixtures/open5e/transformed'
import handler from '~~/server/api/srd/conditions.get'

const SYNCED_AT = '2026-09-01T00:00:00.000Z'

function stubConditions(data: unknown[]): SupabaseChain {
  const chain = mockChain({ data, error: null })

  mockFrom({ srd_conditions: chain })

  return chain
}

describe('GET /api/srd/conditions', () => {
  it('returns the stored conditions without their sync bookkeeping', async () => {
    stubConditions([
      { ...dndConditionFixture, documentKey: 'core', syncedAt: SYNCED_AT },
    ])

    await expect(handler(mockEvent())).resolves.toEqual([dndConditionFixture])
  })

  it('reads only the core document set, in name order', async () => {
    const chain = stubConditions([])

    await handler(mockEvent())

    expect(chain.eq).toHaveBeenCalledWith('documentKey', 'core')
    expect(chain.order).toHaveBeenCalledWith('name', { ascending: true })
  })

  it('caches at the static tier', async () => {
    stubConditions([])

    const event = mockEvent()

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('fails loudly when postgres refuses the query', async () => {
    mockFrom({
      srd_conditions: mockChain({
        data: null,
        error: { message: 'permission denied' },
      }),
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 500,
    })
  })
})
