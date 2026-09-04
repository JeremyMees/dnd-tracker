import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import {
  open5eV2ConditionFixture,
  open5eV2ExhaustionFixture,
} from '~~/test/fixtures/open5e/v2'
import handler from '~~/server/api/open5e/conditions.get'

function upstream(results: Open5eCondition[]) {
  return { count: results.length, next: null, previous: null, results }
}

function query() {
  return new URL(mockFetch.mock.calls[0]![0]).searchParams
}

describe('GET /api/open5e/conditions', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('transforms the upstream conditions', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2ConditionFixture]))

    await expect(handler(mockEvent())).resolves.toEqual([
      toCondition(open5eV2ConditionFixture, ['srd-2024']),
    ])
  })

  it('prefers the 2024 wording', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2ConditionFixture]))

    const [condition] = await handler(mockEvent())

    expect(condition!.desc).toBe('A Blinded creature cannot see.')
  })

  it('keeps the level flag on conditions that stack', async () => {
    mockFetch.mockResolvedValue(upstream([open5eV2ExhaustionFixture]))

    const [condition] = await handler(mockEvent())

    expect(condition).toMatchObject({ hasLevels: true, level: 1 })
  })

  it('falls back to the first description when 2024 has no wording', async () => {
    mockFetch.mockResolvedValue(
      upstream([
        {
          ...open5eV2ConditionFixture,
          descriptions: [
            {
              desc: 'A third party wording.',
              document: 'kobold-press',
              gamesystem: '5e-2024',
            },
            {
              desc: 'The 2014 wording.',
              document: 'srd-2014',
              gamesystem: '5e-2014',
            },
          ],
        } as Open5eCondition,
      ]),
    )

    const [condition] = await handler(mockEvent())

    expect(condition!.desc).toBe('A third party wording.')
  })

  it('asks only for the core document set', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(mockEvent())

    expect(query().get('document__key__in')).toBe('core')
    expect(query().get('page')).toBe('1')
  })

  it('strips the nested document payload from the upstream request', async () => {
    mockFetch.mockResolvedValue(upstream([]))

    await handler(mockEvent())

    expect(query().get('exclude')).toBe('document')
  })

  it('caches at the static tier', async () => {
    mockFetch.mockResolvedValue(upstream([]))

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
