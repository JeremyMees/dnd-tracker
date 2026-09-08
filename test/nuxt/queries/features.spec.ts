import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
  supabaseRpc,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  useFeatureCount,
  useFeatureCreate,
  useFeatureListing,
  useFeatureVote,
} from '~/queries/features'

describe('features queries', () => {
  beforeEach(async () => {
    await clearQueryCache()
  })

  describe('useFeatureListing', () => {
    it('enriches features with the matching profile cards', async () => {
      mockSupabaseFrom(
        {
          features: mockChain({
            data: [{ id: 1, createdBy: 'user-1', title: 'Idea' }],
            error: null,
            count: 1,
          }),
        },
        {
          rpc: mockChain({
            data: [{ id: 'user-1', username: 'Jeremy', avatar: 'a.png' }],
            error: null,
          }),
        },
      )

      const { vm } = await mountHook(() =>
        useFeatureListing(computed(() => ({ page: 0 }))),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({
        amount: 1,
        pages: 1,
        features: [
          {
            id: 1,
            title: 'Idea',
            createdBy: { id: 'user-1', username: 'Jeremy', avatar: 'a.png' },
          },
        ],
      })
    })

    it('drops features whose author has no matching profile card', async () => {
      mockSupabaseFrom(
        {
          features: mockChain({
            data: [{ id: 1, createdBy: 'user-1', title: 'Idea' }],
            error: null,
            count: 1,
          }),
        },
        { rpc: mockChain({ data: [], error: null }) },
      )

      const { vm } = await mountHook(() =>
        useFeatureListing(computed(() => ({ page: 0 }))),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({ amount: 1, pages: 1, features: [] })
    })

    it('skips the profile lookup when there are no features', async () => {
      const from = mockSupabaseFrom({
        features: mockChain({ data: [], error: null, count: 0 }),
      })

      const { vm } = await mountHook(() =>
        useFeatureListing(computed(() => ({ page: 0 }))),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({ amount: 0, pages: 1, features: [] })
      expect(from).toHaveBeenCalledWith('features')
    })

    it('surfaces an error from the profile card lookup', async () => {
      mockSupabaseFrom(
        {
          features: mockChain({
            data: [{ id: 1, createdBy: 'user-1', title: 'Idea' }],
            error: null,
            count: 1,
          }),
        },
        { rpc: mockChain({ data: null, error: { message: 'boom' } }) },
      )

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return useFeatureListing(computed(() => ({ page: 0 })))
      })

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(vm.error).toMatchObject({ message: 'boom' })
    })
  })

  describe('useFeatureCount', () => {
    it('returns the count', async () => {
      mockSupabaseFrom({
        features: mockChain({ data: null, error: null, count: 3 }),
      })

      const { vm } = await mountHook(() => useFeatureCount())

      await vi.waitFor(() => expect(vm.data).toBe(3))
    })

    it('reports no requests when the count comes back empty', async () => {
      mockSupabaseFrom({
        features: mockChain({ data: null, error: null, count: null }),
      })

      const { vm } = await mountHook(() => useFeatureCount())

      await vi.waitFor(() => expect(vm.data).toBe(0))
    })
  })

  describe('useFeatureCreate', () => {
    it('inserts the feature request and invalidates caches', async () => {
      const from = mockSupabaseFrom({
        features: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useFeatureCreate())

      await vm.mutateAsync({
        data: { title: 'Idea', text: 'desc' } as FeatureInsert,
      })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { title: 'Idea', text: 'desc' },
      ])
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        features: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useFeatureCreate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          data: { title: 'Idea', text: 'desc' } as FeatureInsert,
          ...spies,
        }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(spies.onSuccess).not.toHaveBeenCalled()
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ features: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useFeatureCreate())
      const spies = mutationSpies()

      await vm.mutateAsync({
        data: { title: 'Idea', text: 'desc' } as FeatureInsert,
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })
  })

  describe('useFeatureVote', () => {
    it('casts a vote through the vote_feature rpc', async () => {
      mockSupabaseFrom({}, { rpc: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useFeatureVote())

      const spies = mutationSpies()

      await vm.mutateAsync({ id: 5, vote: 'like', ...spies })

      expect(supabaseRpc).toHaveBeenCalledWith('vote_feature', {
        p_feature: 5,
        p_vote: 'like',
      })
      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('sends an empty vote when clearing a vote', async () => {
      mockSupabaseFrom({}, { rpc: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useFeatureVote())

      await vm.mutateAsync({ id: 5, vote: null })

      expect(supabaseRpc).toHaveBeenCalledWith('vote_feature', {
        p_feature: 5,
        p_vote: '',
      })
    })

    it('toasts a generic error on failure', async () => {
      mockSupabaseFrom(
        {},
        { rpc: mockChain({ data: null, error: { message: 'boom' } }) },
      )

      const { vm } = await mountHook(() => useFeatureVote())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({ id: 5, vote: 'like', ...spies }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
