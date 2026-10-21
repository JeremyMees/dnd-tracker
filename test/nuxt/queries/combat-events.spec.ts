import { toast } from '~~/test/nuxt/stubs/toast'
import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
} from '~~/test/nuxt/stubs/query'
import {
  optimisticCombatEvents,
  useCombatEvents,
  useCombatEventsClear,
  useCombatEventsLog,
} from '~/queries/combat-events'

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

    it('toasts that the combat log was not cleared and why', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('forbidden'), { statusCode: 403 }),
      )

      const { vm } = await mountHook(() => useCombatEventsClear())

      await expect(vm.mutateAsync({ encounterId: 7 })).rejects.toThrow(
        'forbidden',
      )

      expect(toast.error).toHaveBeenCalledWith(
        'pages.encounter.toasts.combatLogClearFailed',
        { description: 'general.error.reasons.forbidden' },
      )
    })
  })

  describe('optimisticCombatEvents', () => {
    it('turns drafts into rows, newest first, with negative ids', () => {
      const rows = optimisticCombatEvents(
        7,
        2,
        [
          { type: 'hp', payload: { amount: 3 } },
          { type: 'turn', rowId: 'row-2', payload: { rowName: 'Goblin' } },
        ],
        'row-1',
      )

      expect(rows.map(row => [row.type, row.rowId, row.round])).toEqual([
        ['turn', 'row-2', 2],
        ['hp', 'row-1', 2],
      ])
      expect(rows.every(row => row.id < 0)).toBe(true)
    })

    it('leaves the row empty when neither the draft nor the caller has one', () => {
      const [row] = optimisticCombatEvents(7, 1, [
        { type: 'roll', payload: { kind: 'dice' } },
      ])

      expect(row?.rowId).toBeNull()
    })
  })

  describe('useCombatEventsLog', () => {
    const events: CombatEventDraft[] = [
      { type: 'row_added', rowId: 'row-3', payload: { rowName: 'Wolf' } },
    ]

    it('posts the events of the encounter', async () => {
      const { vm } = await mountHook(() => useCombatEventsLog())

      await vm.mutateAsync({ encounterId: 7, events })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/events', {
        method: 'POST',
        body: { events },
      })
    })

    it('shows the events in the cached log in the round of the sheet', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}))

      const { vm } = await mountHook(() => ({
        log: useCombatEventsLog(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        round: 4,
      })
      vm.queryClient.setQueryData(['useCombatEvents', 7], [event])

      vm.log.mutate({ encounterId: 7, events })

      await vi.waitFor(() =>
        expect(
          vm.queryClient.getQueryData<CombatEventRow[]>(['useCombatEvents', 7]),
        ).toEqual([
          expect.objectContaining({
            type: 'row_added',
            rowId: 'row-3',
            round: 4,
          }),
          event,
        ]),
      )
    })

    it('does not create a log that was never loaded', async () => {
      const { vm } = await mountHook(() => ({
        log: useCombatEventsLog(),
        queryClient: useQueryClient(),
      }))

      await vm.log.mutateAsync({ encounterId: 7, events })

      expect(
        vm.queryClient.getQueryData(['useCombatEvents', 7]),
      ).toBeUndefined()
    })

    it.each([
      ['succeeds', () => fetchMock.mockResolvedValue({ logged: 1 })],
      ['fails', () => fetchMock.mockRejectedValue(new Error('boom'))],
    ])('refetches the log when the post %s', async (_label, setup) => {
      setup()

      const { vm } = await mountHook(() => ({
        log: useCombatEventsLog(),
        queryClient: useQueryClient(),
      }))
      const invalidate = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.log.mutateAsync({ encounterId: 7, events }).catch(() => {})

      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['useCombatEvents', 7],
      })
    })
  })
})
