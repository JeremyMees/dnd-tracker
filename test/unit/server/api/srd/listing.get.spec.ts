import { describe, expect, it } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import type { SupabaseChain } from '~~/test/unit/stubs/supabase'
import {
  dndMonsterFixture,
  dndSpellFixture,
} from '~~/test/fixtures/open5e/transformed'
import handler from '~~/server/api/srd/listing.get'

const SYNCED_AT = '2026-09-01T00:00:00.000Z'

function row(item: DndItem, documentKey = 'srd-2024') {
  return { ...item, documentKey, syncedAt: SYNCED_AT }
}

function listingEvent(query: Record<string, string> = {}) {
  const search = new URLSearchParams({
    type: 'spells',
    documents: 'srd-2024',
    ...query,
  })

  return mockEvent({ path: `/api/srd/listing?${search}` })
}

function stubTable(
  table: string,
  data: unknown[],
  count = data.length,
): SupabaseChain {
  const chain = mockChain({ data, count, error: null })

  mockFrom({ [table]: chain })

  return chain
}

function orderedBy(chain: SupabaseChain) {
  return chain.order.mock.calls.map(([column, options]) => [
    column,
    (options as { ascending: boolean } | undefined)?.ascending,
  ])
}

describe('GET /api/srd/listing', () => {
  it('returns the stored rows without their sync bookkeeping', async () => {
    stubTable('srd_spells', [row(dndSpellFixture)])

    await expect(handler(listingEvent())).resolves.toEqual({
      type: 'spells',
      items: [dndSpellFixture],
      pages: 1,
    })
  })

  it('reads monsters from their own table', async () => {
    stubTable('srd_monsters', [row(dndMonsterFixture)])

    await expect(handler(listingEvent({ type: 'monsters' }))).resolves.toEqual({
      type: 'monsters',
      items: [dndMonsterFixture],
      pages: 1,
    })
  })

  it('turns the zero based page into a row range', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent({ page: '3' }))

    expect(chain.range).toHaveBeenCalledWith(60, 79)
  })

  it('derives the page count from the exact row count', async () => {
    stubTable('srd_spells', [row(dndSpellFixture)], 41)

    await expect(handler(listingEvent())).resolves.toMatchObject({ pages: 3 })
  })

  it('asks postgres for an exact count so paging stays honest', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent())

    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact' })
  })

  it('matches the search term anywhere in the name', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent({ search: 'fire' }))

    expect(chain.ilike).toHaveBeenCalledWith('name', '%fire%')
  })

  it('matches everything when no search term was given', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent())

    expect(chain.ilike).toHaveBeenCalledWith('name', '%%')
  })

  it('escapes wildcards so a search for them stays literal', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent({ search: '50% _ \\' }))

    expect(chain.ilike).toHaveBeenCalledWith('name', '%50\\% \\_ \\\\%')
  })

  it('pins a challenge rating to an exact match', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(listingEvent({ type: 'monsters', cr: '5' }))

    expect(chain.eq).toHaveBeenCalledWith('challengeRating', 5)
  })

  it('keeps challenge rating zero as a real filter', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(listingEvent({ type: 'monsters', cr: '0' }))

    expect(chain.eq).toHaveBeenCalledWith('challengeRating', 0)
  })

  it('sends no challenge rating filter when none was given', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(listingEvent({ type: 'monsters' }))

    expect(chain.eq).not.toHaveBeenCalled()
  })

  it('maps a descending monster ordering onto its column', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(listingEvent({ type: 'monsters', ordering: '-hitPoints' }))

    expect(orderedBy(chain)).toEqual([
      ['hitPoints', false],
      ['id', true],
    ])
  })

  it('maps an ascending monster ordering onto its column', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(
      listingEvent({ type: 'monsters', ordering: 'challengeRating' }),
    )

    expect(orderedBy(chain)).toEqual([
      ['challengeRating', true],
      ['id', true],
    ])
  })

  it('falls back to name for an ordering the type has no column for', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent({ ordering: '-armorClass' }))

    expect(orderedBy(chain)).toEqual([
      ['name', true],
      ['id', true],
    ])
  })

  it('orders by name by default', async () => {
    const chain = stubTable('srd_monsters', [])

    await handler(listingEvent({ type: 'monsters' }))

    expect(orderedBy(chain)).toEqual([
      ['name', true],
      ['id', true],
    ])
  })

  it('trims and drops blank entries from the document list', async () => {
    const chain = stubTable('srd_spells', [])

    await handler(listingEvent({ documents: ' srd-2024 , ,srd-2014' }))

    expect(chain.in).toHaveBeenCalledWith('documentKey', [
      'srd-2024',
      'srd-2014',
    ])
  })

  it('returns an empty listing without querying when no documents are selected', async () => {
    const chain = stubTable('srd_spells', [])

    await expect(handler(listingEvent({ documents: '' }))).resolves.toEqual({
      type: 'spells',
      items: [],
      pages: 0,
    })

    expect(chain.select).not.toHaveBeenCalled()
  })

  it('caches an empty listing too', async () => {
    stubTable('srd_spells', [])

    const event = listingEvent({ documents: ' , ' })

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toContain('s-maxage=600')
  })

  it('caches a successful listing at the filtered tier', async () => {
    stubTable('srd_spells', [row(dndSpellFixture)])

    const event = listingEvent()

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=86400, stale-if-error=604800',
    )
    expect(responseHeader(event, 'Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    )
  })

  it('fails loudly when postgres refuses the query', async () => {
    mockFrom({
      srd_spells: mockChain({
        data: null,
        count: null,
        error: { message: 'relation does not exist' },
      }),
    })

    await expect(handler(listingEvent())).rejects.toMatchObject({
      statusCode: 500,
    })
  })

  it('rejects an unknown content type', async () => {
    await expect(
      handler(listingEvent({ type: 'races' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects the documents listing type, which has its own endpoint', async () => {
    await expect(
      handler(listingEvent({ type: 'documents' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a negative page', async () => {
    await expect(handler(listingEvent({ page: '-1' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('rejects an unknown ordering', async () => {
    await expect(
      handler(listingEvent({ ordering: 'name; drop table' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a search term long enough to be an attack', async () => {
    await expect(
      handler(listingEvent({ search: 'a'.repeat(101) })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
