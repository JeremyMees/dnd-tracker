import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  open5eV2ConditionFixture,
  open5eV2MonsterFixture,
} from '~~/test/fixtures/open5e'
import {
  clearQueryCache,
  fetchMock,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  prefetchConditionsListing,
  useConditionsListing,
  useOpen5eDocuments,
  useOpen5eListing,
  useOpen5eMonsterListing,
} from '~/queries/open5e'

describe('open5e queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useOpen5eListing', () => {
    it('fetches, transforms, and narrows the listing to the requested type', async () => {
      fetchMock.mockResolvedValue({
        count: 25,
        results: [open5eV2MonsterFixture],
      })

      const { vm } = await mountHook(() =>
        useOpen5eListing(
          computed(() => ({
            type: 'monsters' as const,
            filters: { page: 0 } as Open5eFilters,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data?.type).toBe('monsters')
      expect(vm.data?.items).toHaveLength(1)
      expect(vm.data?.pages).toBe(2)

      const [url] = fetchMock.mock.calls[0]!

      expect(url).toContain('https://api.open5e.com/v2/creatures/?')
      expect(url).toContain('page=1')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(() =>
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
    it('keeps only 5e-2014/5e-2024 documents, ordered by publication date', async () => {
      fetchMock.mockResolvedValue({
        results: [
          { gamesystem: { key: '5e-2024' } },
          { gamesystem: { key: 'a5e' } },
          { gamesystem: { key: '5e-2014' } },
        ],
      })

      const { vm } = await mountHook(() => useOpen5eDocuments())

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual([
        { gamesystem: { key: '5e-2024' } },
        { gamesystem: { key: '5e-2014' } },
      ])

      const [url] = fetchMock.mock.calls[0]!

      expect(url).toContain('ordering=-publication_date')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(() => useOpen5eDocuments())

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useConditionsListing', () => {
    it('fetches and transforms the srd-2024 condition list', async () => {
      fetchMock.mockResolvedValue({ results: [open5eV2ConditionFixture] })

      const { vm } = await mountHook(() => useConditionsListing())

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data?.[0]?.id).toBe('blinded')

      const [url] = fetchMock.mock.calls[0]!

      expect(url).toContain('document__key__in=core')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(() => useConditionsListing())

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('prefetchConditionsListing', () => {
    it('resolves with the transformed conditions', async () => {
      fetchMock.mockResolvedValue({ results: [open5eV2ConditionFixture] })

      const { vm } = await mountHook(async () => ({
        result: await prefetchConditionsListing(),
      }))

      expect(vm.result?.[0]?.id).toBe('blinded')
    })

    it('resolves to undefined instead of throwing when the fetch fails', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(async () => ({
        result: await prefetchConditionsListing(),
      }))

      expect(vm.result).toBeUndefined()
    })
  })

  describe('useOpen5eMonsterListing', () => {
    it('adds a challenge rating range filter when cr is provided', async () => {
      fetchMock.mockResolvedValue({
        count: 5,
        results: [open5eV2MonsterFixture],
      })

      const { vm } = await mountHook(() =>
        useOpen5eMonsterListing(
          computed(() => ({ filters: { page: 0, cr: 5 } as Open5eFilters })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data?.items).toHaveLength(1)
      expect(vm.data?.pages).toBe(1)

      const [url] = fetchMock.mock.calls[0]!

      expect(url).toContain('challenge_rating__gte=5')
      expect(url).toContain('challenge_rating__lte=5')
    })

    it('toasts an error and settles the query into an error state', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { vm } = await mountHook(() =>
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
})
