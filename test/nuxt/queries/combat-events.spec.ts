import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
} from '~~/test/nuxt/stubs/query'
import { useCombatEvents, useCombatEventsClear } from '~/queries/combat-events'

const event = { id: 1, encounterId: 7, type: 'damage' } as CombatEventRow

describe('combat-events queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useCombatEvents', () => {
    it('fetches the events of the encounter, newest first', async () => {
      const from = mockSupabaseFrom({
        combat_events: mockChain({ data: [event], error: null }),
      })

      const { vm } = await mountHook(() => useCombatEvents(7))

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      const chain = from.mock.results[0]!.value

      expect(vm.data).toEqual([event])
      expect(chain.eq).toHaveBeenCalledWith('encounterId', 7)
      expect(chain.order).toHaveBeenCalledWith('id', { ascending: false })
    })

    it('fetches without being told to when enabled is left out', async () => {
      const from = mockSupabaseFrom({
        combat_events: mockChain({ data: [], error: null }),
      })

      const { vm } = await mountHook(() => useCombatEvents(7))

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(from).toHaveBeenCalledWith('combat_events')
    })

    it('does not fetch while disabled', async () => {
      const from = mockSupabaseFrom({
        combat_events: mockChain({ data: [], error: null }),
      })

      const { vm } = await mountHook(() => useCombatEvents(7, false))

      expect(vm.fetchStatus).toBe('idle')
      expect(from).not.toHaveBeenCalled()
    })

    it('starts fetching once a reactive enabled flips on', async () => {
      const from = mockSupabaseFrom({
        combat_events: mockChain({ data: [event], error: null }),
      })
      const enabled = ref(false)

      const { vm } = await mountHook(() => useCombatEvents(7, enabled))

      expect(from).not.toHaveBeenCalled()

      enabled.value = true

      await vi.waitFor(() => expect(vm.data).toEqual([event]))
    })

    it('surfaces a supabase error', async () => {
      mockSupabaseFrom({
        combat_events: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return useCombatEvents(7)
      })

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(vm.error).toMatchObject({ message: 'boom' })
    })
  })

  describe('useCombatEventsClear', () => {
    it('deletes the events of the encounter and empties the cache', async () => {
      const { vm } = await mountHook(() => ({
        clear: useCombatEventsClear(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useCombatEvents', 7], [event])

      await vm.clear.mutateAsync({ encounterId: 7 })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/events', {
        method: 'DELETE',
      })
      expect(
        vm.queryClient.getQueryData<CombatEventRow[]>(['useCombatEvents', 7]),
      ).toEqual([])
    })

    it('leaves the cache alone when the delete fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountHook(() => ({
        clear: useCombatEventsClear(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useCombatEvents', 7], [event])

      await expect(vm.clear.mutateAsync({ encounterId: 7 })).rejects.toThrow(
        'boom',
      )

      expect(
        vm.queryClient.getQueryData<CombatEventRow[]>(['useCombatEvents', 7]),
      ).toEqual([event])
    })
  })
})
