import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  useCampaignCount,
  useCampaignCreate,
  useCampaignDetail,
  useCampaignListing,
  useCampaignMinimalDetail,
  useCampaignMinimalListing,
  useCampaignRemove,
  useCampaignUpdate,
} from '~/queries/campaigns'

describe('campaigns queries', () => {
  beforeEach(async () => {
    await clearQueryCache()
  })

  describe('useCampaignDetail', () => {
    it('returns the campaign', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({
          data: { id: 1, title: 'Lost Mine' },
          error: null,
        }),
      })

      const { vm } = await mountHook(() => useCampaignDetail(1))

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({ id: 1, title: 'Lost Mine' })
    })

    it('surfaces a supabase error', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return useCampaignDetail(1)
      })

      await vi.waitFor(() => expect(vm.isError).toBe(true))
    })
  })

  describe('useCampaignListing', () => {
    it('maps the query result with sub-counts', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({
          data: [
            {
              id: 1,
              title: 'Lost Mine',
              homebrew_items: [{ count: 2 }],
              initiative_sheets: [{ count: 3 }],
            },
          ],
          error: null,
          count: 1,
        }),
      })

      const { vm } = await mountHook(() =>
        useCampaignListing(computed(() => ({ page: 0 }))),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({
        amount: 1,
        pages: 1,
        campaigns: [
          expect.objectContaining({ homebrew_items: 2, initiative_sheets: 3 }),
        ],
      })
    })
  })

  describe('useCampaignMinimalListing', () => {
    it('keeps campaigns the user owns or has a non-viewer role in', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({
          data: [
            { id: 1, createdBy: { id: 'me' }, team: [] },
            {
              id: 2,
              createdBy: { id: 'other' },
              team: [{ user: { id: 'me' }, role: 'Admin' }],
            },
            {
              id: 3,
              createdBy: { id: 'other' },
              team: [{ user: { id: 'me' }, role: 'Viewer' }],
            },
            { id: 4, createdBy: { id: 'other' }, team: [] },
          ],
          error: null,
        }),
      })

      const { vm } = await mountHook(() => useCampaignMinimalListing('me'))

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data?.map((c: { id: number }) => c.id)).toEqual([1, 2])
    })

    it('surfaces a supabase error', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return useCampaignMinimalListing('me')
      })

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(vm.error).toMatchObject({ message: 'boom' })
    })
  })

  describe('useCampaignMinimalDetail', () => {
    it('returns undefined without hitting the database when no id is given', async () => {
      const from = mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        result: useCampaignMinimalDetail(),
      }))

      expect(vm.result).toBeUndefined()
      expect(from).not.toHaveBeenCalled()
    })

    it('fetches the campaign when an id is given', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: { id: 5, title: 'Cave' }, error: null }),
      })

      const { vm } = await mountHook(() => ({
        result: useCampaignMinimalDetail(5),
      }))

      await vi.waitFor(() => expect(vm.result?.data.value).toBeDefined())

      expect(vm.result?.data.value).toEqual({ id: 5, title: 'Cave' })
    })

    it('surfaces a supabase error', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return { result: useCampaignMinimalDetail(5) }
      })

      await vi.waitFor(() => expect(vm.result?.isError.value).toBe(true))

      expect(vm.result?.error.value).toMatchObject({ message: 'boom' })
    })
  })

  describe('useCampaignCount', () => {
    it('returns the count', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null, count: 4 }),
      })

      const { vm } = await mountHook(() => useCampaignCount())

      await vi.waitFor(() => expect(vm.data).toBe(4))
    })

    it('reports no campaigns when the count comes back empty', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null, count: null }),
      })

      const { vm } = await mountHook(() => useCampaignCount())

      await vi.waitFor(() => expect(vm.data).toBe(0))
    })
  })

  describe('useCampaignCreate', () => {
    it('inserts the campaign and invalidates listing caches', async () => {
      const from = mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useCampaignCreate(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ data: { title: 'New' } as CampaignInsert })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { title: 'New' },
      ])
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignListing'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignMinimal'],
      })
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ campaigns: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useCampaignCreate())
      const spies = mutationSpies()

      await vm.mutateAsync({
        data: { title: 'New' } as CampaignInsert,
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
      expect(spies.onError).not.toHaveBeenCalled()
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useCampaignCreate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({ data: { title: 'New' } as CampaignInsert, ...spies }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useCampaignUpdate', () => {
    it('updates the campaign and invalidates its detail cache', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useCampaignUpdate(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: 5, data: { title: 'Renamed' } })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 5],
      })
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ campaigns: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useCampaignUpdate())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 5, data: { title: 'Renamed' }, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('toasts on failure even without callbacks', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useCampaignUpdate())

      await expect(
        vm.mutateAsync({ id: 5, data: { title: 'Renamed' } }),
      ).rejects.toThrow('boom')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useCampaignRemove', () => {
    it('invalidates a single detail cache for one id', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useCampaignRemove(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: 5 })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 5],
      })
    })

    it('invalidates a detail cache per id for a bulk removal', async () => {
      const from = mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useCampaignRemove(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: [5, 6] })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 5],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 6],
      })
      expect(from.mock.results[0]!.value.in).toHaveBeenCalledWith('id', [5, 6])
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ campaigns: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useCampaignRemove())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 5, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        campaigns: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useCampaignRemove())
      const spies = mutationSpies()

      await expect(vm.mutateAsync({ id: 5, ...spies })).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
