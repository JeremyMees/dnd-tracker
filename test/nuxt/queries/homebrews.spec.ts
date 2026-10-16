import { toast } from '~~/test/nuxt/stubs/toast'
import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
} from '~~/test/nuxt/stubs/query'
import {
  useHomebrewCount,
  useHomebrewCreate,
  useHomebrewImport,
  useHomebrewListing,
  useHomebrewRemove,
  useHomebrewUpdate,
} from '~/queries/homebrews'

describe('homebrews queries', () => {
  beforeEach(async () => {
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

    it('reports no items when the count comes back empty', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null, count: null }),
      })

      const { vm } = await mountHook(() =>
        useHomebrewCount(
          9,
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBe(0))
    })
  })

  describe('useHomebrewCreate', () => {
    it('inserts the homebrew item and resolves its id', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: { id: 7 }, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewCreate())

      const id = await vm.mutateAsync({
        data: { name: 'Goblin' } as HomebrewItemInsert,
      })

      const chain = from.mock.results[0]!.value

      expect(chain.insert).toHaveBeenCalledWith([{ name: 'Goblin' }])
      expect(chain.select).toHaveBeenCalledWith('id')
      expect(chain.single).toHaveBeenCalled()
      expect(id).toBe(7)
      expect(toast.success).toHaveBeenCalled()
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({ data: { id: 7 }, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewCreate())
      const spies = mutationSpies()

      await vm.mutateAsync({
        data: { name: 'Goblin' } as HomebrewItemInsert,
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
      expect(spies.onError).not.toHaveBeenCalled()
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => useHomebrewCreate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          data: { name: 'Goblin' } as HomebrewItemInsert,
          ...spies,
        }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(spies.onSuccess).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith(
        'components.toast.create.error',
        { description: 'general.error.reasons.rejected' },
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
      expect(chain.select).toHaveBeenCalledWith('id')
      expect(chain.single).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalled()
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewUpdate())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 4, data: { name: 'Orc' }, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('toasts on failure even without callbacks', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useHomebrewUpdate())

      await expect(
        vm.mutateAsync({ id: 4, data: { name: 'Orc' } }),
      ).rejects.toThrow('boom')

      expect(toast.error).toHaveBeenCalledWith(
        'components.toast.update.error',
        { description: 'general.error.reasons.rejected' },
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
      expect(toast.success).toHaveBeenCalled()
    })

    it('deletes multiple homebrew items', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useHomebrewRemove())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: [4, 5], ...spies })

      expect(from.mock.results[0]!.value.in).toHaveBeenCalledWith('id', [4, 5])
      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useHomebrewRemove())
      const spies = mutationSpies()

      await expect(vm.mutateAsync({ id: 4, ...spies })).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(toast.error).toHaveBeenCalledWith(
        'components.toast.delete.error',
        { description: 'general.error.reasons.rejected' },
      )
    })
  })

  describe('useHomebrewImport', () => {
    it('inserts every homebrew item in one call and invalidates', async () => {
      const from = mockSupabaseFrom({
        homebrew_items: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useHomebrewImport(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')
      const data = [
        { name: 'Goblin', campaign: 1 },
        { name: 'Orc', campaign: 1 },
      ] as HomebrewItemInsert[]

      await vm.mutateAsync({ data })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith(data)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useHomebrewListing'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useHomebrewCount'],
      })
      expect(toast.success).toHaveBeenCalledWith(
        'components.toast.import.success',
      )
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        homebrew_items: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => useHomebrewImport())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          data: [{ name: 'Goblin', campaign: 1 }] as HomebrewItemInsert[],
          ...spies,
        }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(toast.error).toHaveBeenCalledWith(
        'components.toast.import.error',
        { description: 'general.error.reasons.rejected' },
      )
    })
  })
})
