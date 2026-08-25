import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import {
  useJoinTokenCreate,
  useJoinTokenRemove,
  useTeamMemberCreate,
  useTeamMemberRemove,
  useTeamMemberUpdate,
} from '~/queries/team-members'

describe('team-members queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useJoinTokenCreate', () => {
    it('creates a join token and inserts the join_campaign row', async () => {
      fetchMock.mockResolvedValue('jwt-token')

      const from = mockSupabaseFrom({
        join_campaign: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useJoinTokenCreate())

      const result = await vm.mutateAsync({
        data: { campaign: 1, role: 'Player' } as TeamInsert,
      })

      expect(result).toBe('jwt-token')
      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { campaign: 1, role: 'Player', token: 'jwt-token' },
      ])
    })

    it('throws when no token is returned', async () => {
      fetchMock.mockResolvedValue(undefined)

      const { vm } = await mountHook(() => useJoinTokenCreate())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({
          data: { campaign: 1, role: 'Player' } as TeamInsert,
          onError,
        }),
      ).rejects.toThrow('Failed to create join token')

      expect(onError).toHaveBeenCalledWith('Failed to create join token')
    })
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
  })

  describe('useTeamMemberCreate', () => {
    it('inserts the team member and invalidates campaign caches', async () => {
      const from = mockSupabaseFrom({
        team: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useTeamMemberCreate(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({
        data: { campaign: 1, role: 'Player' } as TeamInsert,
      })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { campaign: 1, role: 'Player' },
      ])
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 1],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignListing'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignMinimal'],
      })
    })

    it('removes the pending join_campaign invite once the team member is created', async () => {
      const from = mockSupabaseFrom({
        team: mockChain({ data: null, error: null }),
        join_campaign: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useTeamMemberCreate())

      await vm.mutateAsync({
        data: { campaign: 1, role: 'Player' } as TeamInsert,
        id: 9,
      })

      expect(from).toHaveBeenCalledWith('join_campaign')
      expect(from.mock.results[1]!.value.eq).toHaveBeenCalledWith('id', 9)
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

      await vm.mutateAsync({ member: 3, campaign: 1 })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', 3)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useCampaignDetail', 1],
      })
    })

    it('toasts a generic error on failure', async () => {
      mockSupabaseFrom({
        team: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useTeamMemberRemove())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({ member: 3, campaign: 1, onError }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
