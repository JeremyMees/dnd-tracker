import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import {
  open5eV2MonsterFixture,
  open5eV2SpellFixture,
} from '~~/test/fixtures/open5e/v2'
import {
  dndMonsterFixture,
  dndSpellFixture,
} from '~~/test/fixtures/open5e/transformed'
import handler from '~~/server/api/open5e/listing.get'

function listingEvent(query: Record<string, string> = {}) {
  const search = new URLSearchParams({
    type: 'spells',
    documents: 'srd-2024',
    ...query,
  })

  return mockEvent({ path: `/api/open5e/listing?${search}` })
}

function upstreamParams() {
  return new URL(mockFetch.mock.calls[0]![0]).searchParams
}

function upstream(results: unknown[], count = results.length) {
  return { count, next: null, previous: null, results }
}

describe('GET /api/open5e/listing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('transforms the upstream results into dnd items', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2SpellFixture]))

    await expect(handler(listingEvent())).resolves.toEqual({
      type: 'spells',
      items: [dndSpellFixture],
      pages: 1,
    })
  })

  it('transforms monsters when asked for monsters', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2MonsterFixture]))

    await expect(handler(listingEvent({ type: 'monsters' }))).resolves.toEqual({
      type: 'monsters',
      items: [dndMonsterFixture],
      pages: 1,
    })
  })

  it('turns the zero based page into open5e one based paging', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ page: '3' }))

    expect(upstreamParams().get('page')).toBe('4')
    expect(upstreamParams().get('limit')).toBe('20')
  })

  it('derives the page count from the upstream total', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2SpellFixture], 41))

    await expect(handler(listingEvent())).resolves.toMatchObject({ pages: 3 })
  })

  it('sends the search term as a name filter', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ search: 'fire' }))

    expect(upstreamParams().get('name__icontains')).toBe('fire')
  })

  it('omits the name filter when no search term was given', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent())

    expect(upstreamParams().has('name__icontains')).toBe(false)
  })

  it('pins a challenge rating to an exact match', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ type: 'monsters', cr: '5' }))

    const params = upstreamParams()

    expect(params.get('challenge_rating__gte')).toBe('5')
    expect(params.get('challenge_rating__lte')).toBe('5')
  })

  it('keeps challenge rating zero as a real filter', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ type: 'monsters', cr: '0' }))

    expect(upstreamParams().get('challenge_rating__gte')).toBe('0')
  })

  it('sends no challenge rating filter when none was given', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ type: 'monsters' }))

    expect(upstreamParams().has('challenge_rating__gte')).toBe(false)
  })

  it('forwards the requested ordering', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ type: 'monsters', ordering: '-hit_points' }))

    expect(upstreamParams().get('ordering')).toBe('-hit_points')
  })

  it('orders by name by default', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent())

    expect(upstreamParams().get('ordering')).toBe('name')
  })

  it('trims and drops blank entries from the document list', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(listingEvent({ documents: ' srd-2024 , ,srd-2014' }))

    expect(upstreamParams().get('document__key__in')).toBe('srd-2024,srd-2014')
  })

  it('returns an empty listing without calling open5e when no documents are selected', async () => {
    await expect(handler(listingEvent({ documents: '' }))).resolves.toEqual({
      type: 'spells',
      items: [],
      pages: 0,
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('caches an empty listing too', async () => {
    const event = listingEvent({ documents: ' , ' })

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toContain('s-maxage=600')
  })

  it('caches a successful listing at the filtered tier', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2SpellFixture]))

    const event = listingEvent()

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=86400, stale-if-error=604800',
    )
    expect(responseHeader(event, 'Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    )
  })

  it('never caches a failed listing', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const event = listingEvent()

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 503 })

    expect(responseHeader(event, 'CDN-Cache-Control')).toBeUndefined()
    expect(responseHeader(event, 'Cache-Control')).toBeUndefined()
  })

  it('rejects an unknown content type', async () => {
    await expect(
      handler(listingEvent({ type: 'races' })),
    ).rejects.toMatchObject({ statusCode: 400 })

    expect(mockFetch).not.toHaveBeenCalled()
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

  it('rejects a search term long enough to be an attack on the cache key space', async () => {
    await expect(
      handler(listingEvent({ search: 'a'.repeat(101) })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
