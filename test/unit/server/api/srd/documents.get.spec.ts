import { describe, expect, it } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import type { SupabaseChain } from '~~/test/unit/stubs/supabase'
import { gameSystems } from '~~/constants/dnd'
import handler from '~~/server/api/srd/documents.get'

const SYNCED_AT = '2026-09-01T00:00:00.000Z'

function documentRow(id: string, gamesystemKey: Open5eGameSystem) {
  return {
    id,
    name: id,
    displayName: id,
    gamesystemKey,
    publisherKey: 'wizards-of-the-coast',
    publisherName: 'Wizards of the Coast',
    publicationDate: '2024-01-01',
    permalink: `https://example.com/${id}`,
    syncedAt: SYNCED_AT,
  }
}

function stubDocuments(data: unknown[]): SupabaseChain {
  const chain = mockChain({ data, error: null })

  mockFrom({ srd_documents: chain })

  return chain
}

describe('GET /api/srd/documents', () => {
  it('returns the stored documents without their sync bookkeeping', async () => {
    const { syncedAt, ...document } = documentRow('srd-2024', '5e-2024')

    stubDocuments([{ ...document, syncedAt }])

    await expect(handler(mockEvent())).resolves.toEqual([document])
  })

  it('asks postgres for only the game systems the app supports', async () => {
    const chain = stubDocuments([])

    await handler(mockEvent())

    expect(chain.in).toHaveBeenCalledWith('gamesystemKey', gameSystems)
  })

  it('puts the newest documents first', async () => {
    const chain = stubDocuments([])

    await handler(mockEvent())

    expect(chain.order).toHaveBeenCalledWith('publicationDate', {
      ascending: false,
      nullsFirst: false,
    })
  })

  it('caches at the static tier', async () => {
    stubDocuments([])

    const event = mockEvent()

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('fails loudly when postgres refuses the query', async () => {
    mockFrom({
      srd_documents: mockChain({
        data: null,
        error: { message: 'permission denied' },
      }),
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({
      statusCode: 500,
    })
  })
})
