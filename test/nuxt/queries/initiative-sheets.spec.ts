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
  useInitiativeSheetDetail,
  useInitiativeSheetDetailUpdate,
  useInitiativeSheetPatch,
  useInitiativeSheetSync,
} from '~/queries/initiative-sheets'

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
}

describe('initiative-sheets queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useInitiativeSheetDetail', () => {
    it('fetches and returns the sheet', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({
          data: { id: 7, title: 'Ambush', rows: [row] },
          error: null,
        }),
      })

      const { vm } = await mountHook(() => useInitiativeSheetDetail(7))

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({ id: 7, title: 'Ambush', rows: [row] })
    })

    it('surfaces a supabase error', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => {
        useQueryClient().setDefaultOptions({ queries: { retry: false } })

        return useInitiativeSheetDetail(7)
      })

      await vi.waitFor(() => expect(vm.isError).toBe(true))
    })
  })

  describe('useInitiativeSheetSync', () => {
    it('posts to the sync endpoint', async () => {
      fetchMock.mockResolvedValue(undefined)

      const { vm } = await mountHook(() => useInitiativeSheetSync())

      await vm.mutateAsync({ id: 7 })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/sync', {
        method: 'POST',
      })
    })
  })

  describe('useInitiativeSheetPatch', () => {
    it('patches a row through the server route and updates the cache optimistically', async () => {
      fetchMock.mockResolvedValue({ row: { ...row, hitPoints: 6 } })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row],
      })

      const promise = vm.mutateAsync({
        id: 7,
        rowId: 'row-1',
        patch: { hitPoints: 6 },
      })

      await vi.waitFor(() => {
        const cached = vm.queryClient.getQueryData<InitiativeSheet>([
          'useInitiativeSheetDetail',
          7,
        ])
        expect(cached?.rows[0]?.hitPoints).toBe(6)
      })

      await promise

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/patch-row', {
        method: 'POST',
        body: { rowId: 'row-1', patch: { hitPoints: 6 } },
      })
    })

    it('rolls back the optimistic patch when the request fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row],
      })

      await expect(
        vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } }),
      ).rejects.toThrow('boom')

      const cached = vm.queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        7,
      ])

      expect(cached?.rows[0]?.hitPoints).toBe(10)
    })
  })

  describe('useInitiativeSheetDetailUpdate', () => {
    it('sanitizes and reindexes rows before updating', async () => {
      const from = mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null }),
      })

      fetchMock.mockResolvedValue(undefined)

      const { vm } = await mountHook(() => useInitiativeSheetDetailUpdate())

      await vm.mutateAsync({
        id: 7,
        data: {
          rows: [
            { ...row, initiative: 5, index: 3 },
            { ...row, id: 'row-2', initiative: 15, index: 1 },
          ],
        },
      })

      expect(from).toHaveBeenCalledWith('initiative_sheets')

      const chain = from.mock.results[0]!.value
      const updated = chain.update.mock.calls[0]![0]

      expect(updated.rows.map((r: InitiativeSheetRow) => r.id)).toEqual([
        'row-2',
        'row-1',
      ])
      expect(updated.rows.map((r: InitiativeSheetRow) => r.index)).toEqual([
        0, 1,
      ])
    })

    it('syncs the sheet channel after a successful update', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null }),
      })

      fetchMock.mockResolvedValue(undefined)

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetDetailUpdate(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [],
      })

      await vm.mutateAsync({ id: 7, data: { title: 'Renamed' } })

      await vi.waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/sync', {
          method: 'POST',
        }),
      )
    })

    it('rolls back the cache and reports the error when the update fails', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetDetailUpdate(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [],
      })

      const onError = vi.fn()

      await expect(
        vm.mutateAsync({ id: 7, data: { title: 'Renamed' }, onError }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')

      const cached = vm.queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        7,
      ])

      expect(cached?.title).toBe('Ambush')
    })
  })
})
