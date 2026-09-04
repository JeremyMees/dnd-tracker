import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import handler from '~~/server/api/open5e/documents.get'

function document(key: string, gamesystem: Open5eGameSystem): Open5eDocument {
  return {
    key,
    name: key,
    url: `https://api.open5e.com/v2/documents/${key}/`,
    display_name: key,
    desc: '',
    type: 'SOURCE',
    author: 'someone',
    publication_date: '2024-01-01',
    permalink: 'https://example.com',
    distance_unit: 'feet',
    weight_unit: 'pounds',
    licenses: [],
    publisher: { name: 'p', key: 'p', url: 'https://example.com' },
    gamesystem: {
      name: gamesystem,
      key: gamesystem,
      url: `https://api.open5e.com/v2/gamesystems/${gamesystem}/`,
    },
  }
}

function upstream(results: Open5eDocument[], count = results.length) {
  return { count, next: null, previous: null, results }
}

function pageParams(call = 0) {
  return new URL(mockFetch.mock.calls[call]![0]).searchParams
}

describe('GET /api/open5e/documents', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('keeps only the game systems the app supports', async () => {
    const srd2024 = document('srd-2024', '5e-2024')
    const srd2014 = document('srd-2014', '5e-2014')

    mockFetch.mockResolvedValue(
      upstream([srd2024, document('a5e-ag', 'a5e'), srd2014]),
    )

    await expect(handler(mockEvent())).resolves.toEqual([srd2024, srd2014])
  })

  it('returns nothing when no supported document is published', async () => {
    mockFetch.mockResolvedValue(upstream([document('a5e-ag', 'a5e')]))

    await expect(handler(mockEvent())).resolves.toEqual([])
  })

  it('asks open5e for the newest documents first', async () => {
    mockFetch.mockResolvedValue(upstream([document('srd-2024', '5e-2024')]))

    await handler(mockEvent())

    expect(pageParams().get('ordering')).toBe('-publication_date')
    expect(pageParams().get('page')).toBe('1')
  })

  it('asks for far more documents than open5e publishes, in one page', async () => {
    mockFetch.mockResolvedValue(upstream([document('srd-2024', '5e-2024')]))

    await handler(mockEvent())

    expect(pageParams().get('limit')).toBe('100')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('tops up from later pages when open5e caps the page size', async () => {
    const first = document('srd-2024', '5e-2024')
    const second = document('srd-2014', '5e-2014')

    mockFetch
      .mockResolvedValueOnce(upstream([first], 2))
      .mockResolvedValueOnce(upstream([second], 2))

    await expect(handler(mockEvent())).resolves.toEqual([first, second])

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(pageParams(1).get('page')).toBe('2')
  })

  it('stops paging as soon as it holds every document', async () => {
    mockFetch.mockResolvedValue(upstream([document('srd-2024', '5e-2024')], 1))

    await handler(mockEvent())

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('stops paging on an empty page rather than spinning', async () => {
    mockFetch.mockResolvedValue(upstream([], 500))

    await expect(handler(mockEvent())).resolves.toEqual([])

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('gives up at the page ceiling instead of looping forever', async () => {
    mockFetch.mockResolvedValue(
      upstream([document('srd-2024', '5e-2024')], 9999),
    )

    await handler(mockEvent())

    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('sends no exclude list, since documents carry no nested payload', async () => {
    mockFetch.mockResolvedValue(upstream([document('srd-2024', '5e-2024')]))

    await handler(mockEvent())

    expect(pageParams().has('exclude')).toBe(false)
  })

  it('caches at the static tier', async () => {
    mockFetch.mockResolvedValue(upstream([document('srd-2024', '5e-2024')]))

    const event = mockEvent()

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('never caches a failed lookup', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const event = mockEvent()

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 503 })

    expect(responseHeader(event, 'CDN-Cache-Control')).toBeUndefined()
  })
})
