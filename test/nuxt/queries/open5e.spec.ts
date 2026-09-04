import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import {
  dndConditionFixture,
  dndMonsterFixture,
  dndSpellFixture,
  open5eDocumentFixture,
} from '~~/test/fixtures/open5e'
import {
  clearQueryCache,
  fetchMock,
  fetchRawMock,
  mockRawResponse,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import { useOpen5eStatus } from '~/composables/useOpen5eStatus'
import {
  prefetchConditionsListing,
  useConditionsListing,
  useOpen5eDocuments,
  useOpen5eListing,
  useOpen5eMonsterListing,
} from '~/queries/open5e'

let mounted: VueWrapper | undefined

async function mount<T extends Record<string, unknown>>(
  setupFn: () => T | Promise<T>,
) {
  const result = await mountHook(setupFn)

  mounted = result.component as unknown as VueWrapper

  return result
}

function request() {
  const [url, options] = fetchRawMock.mock.calls[0]!

  return { url, query: options?.query as Record<string, unknown> | undefined }
}

describe('open5e queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    fetchRawMock.mockReset()
    clearNuxtState()
    await clearQueryCache()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  describe('useOpen5eListing', () => {
    it('passes the already narrowed listing through untouched', async () => {
      const listing = {
        type: 'spells' as const,
        items: [dndSpellFixture],
        pages: 2,
      }

      fetchRawMock.mockResolvedValue(mockRawResponse(listing))

      const { vm } = await mount(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'spells' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual(listing)
    })

    it('calls our own endpoint rather than open5e directly', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({ type: 'spells', items: [], pages: 0 }),
      )

      await mount(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'spells' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        ),
      )

      expect(request().url).toBe('/api/open5e/listing')
      expect(fetchRawMock.mock.calls[0]![0]).not.toContain('api.open5e.com')
    })

    it('maps the open5e filter names onto the endpoint contract', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({ type: 'spells', items: [], pages: 0 }),
      )

      await mount(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'spells' as const,
            filters: {
              page: 2,
              search: 'fire',
              ordering: 'name',
              documents: ['srd-2024', 'srd-2014'],
            } as Open5eFilters,
          })),
        ),
      )

      expect(request().query).toEqual({
        type: 'spells',
        page: 2,
        search: 'fire',
        documents: 'srd-2024,srd-2014',
        ordering: 'name',
      })
    })

    it('sends empty strings rather than omitting unset filters', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({ type: 'spells', items: [], pages: 0 }),
      )

      await mount(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'spells' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        ),
      )

      expect(request().query).toMatchObject({
        search: '',
        documents: '',
        ordering: 'name',
      })
      expect(request().query).not.toHaveProperty('cr')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchRawMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mount(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'monsters' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useOpen5eDocuments', () => {
    it('passes the already filtered documents through untouched', async () => {
      fetchRawMock.mockResolvedValue(mockRawResponse([open5eDocumentFixture]))

      const { vm } = await mount(() => useOpen5eDocuments())

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual([open5eDocumentFixture])
      expect(request().url).toBe('/api/open5e/documents')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchRawMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mount(() => useOpen5eDocuments())

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useConditionsListing', () => {
    it('requests the conditions endpoint', async () => {
      fetchRawMock.mockResolvedValue(mockRawResponse([dndConditionFixture]))

      const { vm } = await mount(() => useConditionsListing())

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data?.[0]?.id).toBe('blinded')
      expect(request().url).toBe('/api/open5e/conditions')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchRawMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mount(() => useConditionsListing())

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('prefetchConditionsListing', () => {
    it('resolves with the conditions and shares the listing query key', async () => {
      fetchMock.mockResolvedValue([dndConditionFixture])

      const { vm } = await mount(async () => ({
        result: await prefetchConditionsListing(),
      }))

      expect(vm.result?.[0]?.id).toBe('blinded')
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/open5e/conditions')
    })

    it('resolves to undefined instead of throwing when the fetch fails', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mount(async () => ({
        result: await prefetchConditionsListing(),
      }))

      expect(vm.result).toBeUndefined()
    })
  })

  describe('useOpen5eMonsterListing', () => {
    it('forwards the challenge rating and narrows away the listing type', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({
          type: 'monsters',
          items: [dndMonsterFixture],
          pages: 1,
        }),
      )

      const { vm } = await mount(() =>
        useOpen5eMonsterListing(
          computed(() => ({ filters: { page: 0, cr: 5 } as Open5eFilters })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({ items: [dndMonsterFixture], pages: 1 })
      expect(request().query).toMatchObject({ type: 'monsters', cr: 5 })
    })

    it('keeps a zero challenge rating as a real filter', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({ type: 'monsters', items: [], pages: 0 }),
      )

      await mount(() =>
        useOpen5eMonsterListing(
          computed(() => ({ filters: { page: 0, cr: 0 } as Open5eFilters })),
        ),
      )

      expect(request().query).toMatchObject({ cr: 0 })
    })

    it('discards a listing that came back as another type', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({
          type: 'spells',
          items: [dndSpellFixture],
          pages: 1,
        }),
      )

      const { vm } = await mount(() =>
        useOpen5eMonsterListing(
          computed(() => ({ filters: { page: 0 } as Open5eFilters })),
        ),
      )

      await vi.waitFor(() => expect(vm.isSuccess).toBe(true))

      expect(vm.data).toBeUndefined()
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchRawMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mount(() =>
        useOpen5eMonsterListing(
          computed(() => ({ filters: { page: 0 } as Open5eFilters })),
        ),
      )

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
  describe('freshness tracking', () => {
    const STALE_AT = '2026-09-04T12:00:00.000Z'

    function probe() {
      return mount(() => {
        const { data } = useOpen5eListing(
          computed(() => ({
            type: 'spells' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        )
        const { isStale, staleSince } = useOpen5eStatus()

        return { data, isStale, staleSince }
      })
    }

    it('marks the content stale when the endpoint served a saved copy', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse(
          { type: 'spells', items: [], pages: 0 },
          { 'x-open5e-stale-at': STALE_AT },
        ),
      )

      const { vm } = await probe()

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.isStale).toBe(true)
      expect(vm.staleSince).toBe(STALE_AT)
    })

    it('leaves the content fresh when the header is absent', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse({ type: 'spells', items: [], pages: 0 }),
      )

      const { vm } = await probe()

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.isStale).toBe(false)
      expect(vm.staleSince).toBeNull()
    })

    it('recovers once a live response comes back', async () => {
      fetchRawMock.mockResolvedValue(
        mockRawResponse([open5eDocumentFixture], {
          'x-open5e-stale-at': STALE_AT,
        }),
      )

      const { vm } = await mount(() => {
        const { data } = useOpen5eDocuments()
        const { isStale, trackOpen5eFreshness } = useOpen5eStatus()

        return { data, isStale, trackOpen5eFreshness }
      })

      await vi.waitFor(() => expect(vm.isStale).toBe(true))

      vm.trackOpen5eFreshness(null)

      expect(vm.isStale).toBe(false)
    })
  })
})
