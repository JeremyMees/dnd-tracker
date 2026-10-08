import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  useJoinTokenRemove,
  useTeamMemberRemove,
  useTeamMemberUpdate,
} from '~/queries/team-members'

describe('team-members queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useJoinTokenRemove', () => {
    it('deletes the join_campaign row and invalidates the campaign detail cache', async () => {
      const from = mockSupabaseFrom({
        join_campaign: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useJoinTokenRemove(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: 3, campaign: 1 })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', 3)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 1],
      })
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({
        join_campaign: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useJoinTokenRemove())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 3, campaign: 1, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('reports an error and leaves the campaign cache alone on failure', async () => {
      mockSupabaseFrom({
        join_campaign: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => ({
        ...useJoinTokenRemove(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({ id: 3, campaign: 1, ...spies }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(invalidateSpy).not.toHaveBeenCalled()
      expect(toast).toHaveBeenCalledWith({
        title: 'general.error.failed.inviteRevoke',
        description: 'general.error.reasons.rejected',
        variant: 'destructive',
      })
    })
  })

  describe('useTeamMemberUpdate', () => {
    it('updates the team member role', async () => {
      const from = mockSupabaseFrom({
        team: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useTeamMemberUpdate(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: 3, campaign: 1, data: { role: 'Admin' } })

      const chain = from.mock.results[0]!.value

      expect(chain.update).toHaveBeenCalledWith({ role: 'Admin' })
      expect(chain.eq).toHaveBeenCalledWith('id', 3)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 1],
      })
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ team: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useTeamMemberUpdate())
      const spies = mutationSpies()

      await vm.mutateAsync({
        id: 3,
        campaign: 1,
        data: { role: 'Admin' },
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('reports an error when the update fails', async () => {
      mockSupabaseFrom({
        team: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useTeamMemberUpdate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          id: 3,
          campaign: 1,
          data: { role: 'Admin' },
          ...spies,
        }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
    })
  })

  describe('useTeamMemberRemove', () => {
    it('removes the team member and invalidates campaign caches', async () => {
      const from = mockSupabaseFrom({
        team: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useTeamMemberRemove(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      const spies = mutationSpies()

      await vm.mutateAsync({ member: 3, campaign: 1, ...spies })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', 3)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 1],
      })
      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('toasts that the member was not removed and why', async () => {
      mockSupabaseFrom({
        team: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useTeamMemberRemove())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({ member: 3, campaign: 1, onError }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith({
        title: 'general.error.failed.memberRemove',
        description: 'general.error.reasons.rejected',
        variant: 'destructive',
      })
    })
  })
})
