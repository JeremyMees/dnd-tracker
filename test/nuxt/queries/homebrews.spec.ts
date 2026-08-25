import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  useHomebrewCount,
  useHomebrewCreate,
  useHomebrewListing,
  useHomebrewRemove,
  useHomebrewUpdate,
} from '~/queries/homebrews'

describe('homebrews queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await clearQueryCache()
  })

  describe('useHomebrewListing', () => {
    it('maps the query result', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({
          data: [{ id: 1, name: 'Goblin' }],
          error: null,
          count: 1,
        }),
      })

      const { vm } = await mountHook(() =>
        useHomebrewListing(
          computed(() => ({ page: 0 })),
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({
        amount: 1,
        pages: 1,
        homebrews: [{ id: 1, name: 'Goblin' }],
      })
    })

    it('does not fetch while disabled', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: [], error: null, count: 0 }),
      })

      await mountHook(() =>
        useHomebrewListing(
          computed(() => ({ page: 0 })),
          computed(() => false),
        ),
      )

      expect(from).not.toHaveBeenCalled()
    })
  })

  describe('useHomebrewCount', () => {
    it('scopes the count to the campaign', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null, count: 2 }),
      })

      const { vm } = await mountHook(() =>
        useHomebrewCount(
          9,
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBe(2))

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('campaign', 9)
    })
  })

  describe('useHomebrewCreate', () => {
    it('inserts the homebrew item and invalidates caches', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewCreate())

      await vm.mutateAsync({
        data: { name: 'Goblin' } as HomebrewItemInsert,
      })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { name: 'Goblin' },
      ])
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => useHomebrewCreate())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({
          data: { name: 'Goblin' } as HomebrewItemInsert,
          onError,
        }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useHomebrewUpdate', () => {
    it('updates the homebrew item by id', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewUpdate())

      await vm.mutateAsync({ id: 4, data: { name: 'Orc' } })

      const chain = from.mock.results[0]!.value

      expect(chain.update).toHaveBeenCalledWith({ name: 'Orc' })
      expect(chain.eq).toHaveBeenCalledWith('id', 4)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })
  })

  describe('useHomebrewRemove', () => {
    it('deletes a single homebrew item', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewRemove())

      await vm.mutateAsync({ id: 4 })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', 4)
    })

    it('deletes multiple homebrew items', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewRemove())

      await vm.mutateAsync({ id: [4, 5] })

      expect(from.mock.results[0]!.value.in).toHaveBeenCalledWith('id', [4, 5])
    })
  })
})
