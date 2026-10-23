import { toast } from '~~/test/nuxt/stubs/toast'
import { useQueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueryCache,
  fetchMock,
  mockChain,
  mockSupabaseFrom,
  mountHook,
  mutationSpies,
} from '~~/test/nuxt/stubs/query'
import {
  useInitiativeSheetDetail,
  useInitiativeSheetDetailUpdate,
  useInitiativeSheetPatch,
  useInitiativeSheetPatchRows,
  useInitiativeSheetTurn,
  withPendingEdits,
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

  describe('useInitiativeSheetPatchRows', () => {
    const orc: InitiativeSheetRow = {
      ...row,
      id: 'row-2',
      index: 1,
      name: 'Orc',
      type: 'monster',
      hitPoints: 15,
      maxHitPoints: 15,
    }
    const patches = [
      { rowId: 'row-1', patch: { hitPoints: 6 } },
      { rowId: 'row-2', patch: { hitPoints: 9 } },
    ]

    async function mountWithSheet() {
      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatchRows(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        round: 2,
        rows: [row, orc],
      })

      return vm
    }

    function cachedRows(vm: {
      queryClient: ReturnType<typeof useQueryClient>
    }) {
      return vm.queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        7,
      ])?.rows
    }

    it('patches every row in one request and updates the cache optimistically', async () => {
      fetchMock.mockResolvedValue({
        rows: [
          { ...row, hitPoints: 6 },
          { ...orc, hitPoints: 9 },
        ],
      })

      const vm = await mountWithSheet()
      const promise = vm.mutateAsync({ id: 7, patches })

      await vi.waitFor(() =>
        expect(cachedRows(vm)?.map(item => item.hitPoints)).toEqual([6, 9]),
      )

      await promise

      expect(fetchMock).toHaveBeenCalledOnce()
      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/patch-rows', {
        method: 'POST',
        body: { patches },
      })
    })

    it('prepends one optimistic combat event per patched row with unique ids', async () => {
      fetchMock.mockResolvedValue({ rows: [] })

      const vm = await mountWithSheet()

      await vm.mutateAsync({ id: 7, patches })

      const events = vm.queryClient.getQueryData<CombatEventRow[]>([
        'useCombatEvents',
        7,
      ])

      expect(events?.map(event => event.rowId).sort()).toEqual([
        'row-1',
        'row-2',
      ])
      expect(new Set(events?.map(event => event.id)).size).toBe(2)
      expect(events?.every(event => event.round === 2)).toBe(true)
    })

    it('rolls back every row and toasts when the request fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const vm = await mountWithSheet()

      vm.queryClient.setQueryData(['useCombatEvents', 7], [])

      await expect(vm.mutateAsync({ id: 7, patches })).rejects.toThrow('boom')

      expect(cachedRows(vm)?.map(item => item.hitPoints)).toEqual([10, 15])
      expect(vm.queryClient.getQueryData(['useCombatEvents', 7])).toEqual([])
      expect(toast.error).toHaveBeenCalledWith(
        'pages.encounter.toasts.patchFailed.generic',
        expect.any(Object),
      )
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

    it('optimistically prepends a combat event derived from the patch', async () => {
      fetchMock.mockResolvedValue({ row: { ...row, hitPoints: 6 } })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        round: 2,
        rows: [row],
      })

      await vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } })

      const events = vm.queryClient.getQueryData<CombatEventRow[]>([
        'useCombatEvents',
        7,
      ])

      expect(events).toHaveLength(1)
      expect(events?.[0]).toMatchObject({
        encounterId: 7,
        rowId: 'row-1',
        round: 2,
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'damage',
          amount: 4,
          before: 10,
          after: 6,
        },
      })
    })

    it('orders multiple optimistic events so the last-caused event appears first', async () => {
      const deathRow: InitiativeSheetRow = {
        ...row,
        deathSaves: { fail: [true, true, false], save: [false, false, false] },
      }

      fetchMock.mockResolvedValue({
        row: {
          ...deathRow,
          deathSaves: { fail: [true, true, true], save: [false, false, false] },
        },
      })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        round: 1,
        rows: [deathRow],
      })

      await vm.mutateAsync({
        id: 7,
        rowId: 'row-1',
        patch: {
          deathSaves: { fail: [true, true, true], save: [false, false, false] },
        },
      })

      const events = vm.queryClient.getQueryData<CombatEventRow[]>([
        'useCombatEvents',
        7,
      ])

      expect(events?.map(event => event.type)).toEqual(['died', 'death_save'])
    })

    it('does not touch the combat events cache when the patch has no combat effect', async () => {
      fetchMock.mockResolvedValue({ row })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row],
      })

      await vm.mutateAsync({
        id: 7,
        rowId: 'row-1',
        patch: { hitPoints: row.hitPoints },
      })

      expect(
        vm.queryClient.getQueryData(['useCombatEvents', 7]),
      ).toBeUndefined()
    })

    it('rolls back the optimistic combat event when the request fails', async () => {
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
      vm.queryClient.setQueryData(['useCombatEvents', 7], [])

      await expect(
        vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } }),
      ).rejects.toThrow('boom')

      expect(vm.queryClient.getQueryData(['useCombatEvents', 7])).toEqual([])
    })

    it('leaves other rows untouched while patching one', async () => {
      const other: InitiativeSheetRow = { ...row, id: 'row-2', name: 'Bruk' }

      fetchMock.mockResolvedValue({ row: { ...row, hitPoints: 6 } })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row, other],
      })

      await vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } })

      const cached = vm.queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        7,
      ])

      expect(cached?.rows[1]).toEqual(other)
    })

    it('patches without a cached sheet to fall back on', async () => {
      fetchMock.mockResolvedValue({ row: { ...row, hitPoints: 6 } })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      await vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/patch-row', {
        method: 'POST',
        body: { rowId: 'row-1', patch: { hitPoints: 6 } },
      })
      expect(
        vm.queryClient.getQueryData(['useInitiativeSheetDetail', 7]),
      ).toBeUndefined()
    })

    it('skips the event diff when the patched row is not in the cache', async () => {
      fetchMock.mockResolvedValue({ row })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row],
      })

      await vm.mutateAsync({
        id: 7,
        rowId: 'missing-row',
        patch: { hitPoints: 6 },
      })

      expect(
        vm.queryClient.getQueryData(['useCombatEvents', 7]),
      ).toBeUndefined()
    })

    it('hands the caller its callbacks on success', async () => {
      fetchMock.mockResolvedValue({ row })

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetPatch(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        title: 'Ambush',
        rows: [row],
      })

      const spies = mutationSpies()

      await vm.mutateAsync({
        id: 7,
        rowId: 'row-1',
        patch: { hitPoints: 6 },
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('reports the error to the caller when the patch fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountHook(() => useInitiativeSheetPatch())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          id: 7,
          rowId: 'row-1',
          patch: { hitPoints: 6 },
          ...spies,
        }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
    })

    it.each([
      [{ conditions: [] }, 'conditions'],
      [{ hitPoints: 6, concentration: false }, 'hitPoints'],
      [{ tempArmorClass: 2 }, 'armorClass'],
      [
        {
          deathSaves: {
            save: [true, false, false],
            fail: [false, false, false],
          },
        },
        'deathSaves',
      ],
      [{ concentration: true }, 'concentration'],
      [{}, 'row'],
    ] as [Partial<InitiativeSheetRow>, string][])(
      'names the field when a %o patch fails',
      async (patch, field) => {
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
          vm.mutateAsync({ id: 7, rowId: 'row-1', patch }),
        ).rejects.toThrow('boom')

        expect(toast.error).toHaveBeenCalledWith(
          `pages.encounter.toasts.patchFailed.${field}`,
          { description: 'general.error.reasons.rejected' },
        )
      },
    )

    it('explains a permission failure in the toast', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('forbidden'), { statusCode: 403 }),
      )

      const { vm } = await mountHook(() => useInitiativeSheetPatch())

      await expect(
        vm.mutateAsync({ id: 7, rowId: 'row-1', patch: { hitPoints: 6 } }),
      ).rejects.toThrow('forbidden')

      expect(toast.error).toHaveBeenCalledWith(
        'pages.encounter.toasts.patchFailed.generic',
        { description: 'general.error.reasons.forbidden' },
      )
    })
  })

  describe('useInitiativeSheetTurn', () => {
    const prone: DndCondition = {
      id: 'prone',
      name: 'Prone',
      desc: 'On the ground.',
      duration: { rowId: 'row-1', timing: 'end', rounds: 1 },
    }
    const timedRow = { ...row, conditions: [prone] }
    const otherRow = { ...row, id: 'row-2', name: 'Goblin' }
    const cachedSheet = {
      id: 7,
      title: 'Ambush',
      round: 1,
      activeIndex: 0,
      rows: [timedRow, otherRow],
    }

    function turnResult(expired: TurnReminder[] = []): TurnResult {
      return {
        sheet: {
          id: 7,
          title: 'Ambush',
          round: 1,
          activeIndex: 1,
          rows: [row, otherRow],
          settings: { spacing: 'normal', modified: false },
        },
        expired,
        saves: [],
        recharges: [],
      }
    }

    it('advances the cached turn optimistically, then applies the server result', async () => {
      let resolve: (value: TurnResult) => void = () => {}
      fetchMock.mockReturnValue(
        new Promise<TurnResult>(done => {
          resolve = done
        }),
      )

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetTurn(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], cachedSheet)

      const promise = vm.mutateAsync({ id: 7 })

      await vi.waitFor(() => {
        const cached = vm.queryClient.getQueryData<InitiativeSheet>([
          'useInitiativeSheetDetail',
          7,
        ])
        expect(cached?.activeIndex).toBe(1)
        expect(cached?.rows[0]?.conditions).toEqual([])
      })

      resolve(turnResult())
      await promise

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7/turn', {
        method: 'POST',
      })
      expect(
        vm.queryClient.getQueryData<InitiativeSheet>([
          'useInitiativeSheetDetail',
          7,
        ]),
      ).toMatchObject({
        title: 'Ambush',
        activeIndex: 1,
        rows: [row, otherRow],
      })
    })

    it('refreshes the combat log after the turn', async () => {
      fetchMock.mockResolvedValue(turnResult())

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetTurn(),
        queryClient: useQueryClient(),
      }))
      const invalidate = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ id: 7 })

      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['useCombatEvents', 7],
      })
    })

    it('rolls back and explains a failed turn', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('conflict'), { statusCode: 409 }),
      )

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetTurn(),
        queryClient: useQueryClient(),
      }))

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], cachedSheet)

      await expect(vm.mutateAsync({ id: 7 })).rejects.toThrow('conflict')

      expect(
        vm.queryClient.getQueryData(['useInitiativeSheetDetail', 7]),
      ).toEqual(cachedSheet)
      expect(toast.error).toHaveBeenCalledWith(
        'pages.encounter.toasts.updateFailed.turn',
        { description: expect.stringContaining('general.error.reasons.') },
      )
    })

    it('does nothing optimistic without a cached sheet', async () => {
      fetchMock.mockResolvedValue(turnResult())

      const { vm } = await mountHook(() => ({
        ...useInitiativeSheetTurn(),
        queryClient: useQueryClient(),
      }))

      await vm.mutateAsync({ id: 7 })

      expect(
        vm.queryClient.getQueryData(['useInitiativeSheetDetail', 7]),
      ).toBeUndefined()
    })
  })

  describe('useInitiativeSheetDetailUpdate', () => {
    function mountUpdate() {
      return mountHook(() => ({
        ...useInitiativeSheetDetailUpdate(),
        queryClient: useQueryClient(),
      }))
    }

    it('sends the update to the encounter route in one request', async () => {
      fetchMock.mockResolvedValue({ updated: true })

      const { vm } = await mountUpdate()

      await vm.mutateAsync({ id: 7, data: { activeIndex: 1, round: 2 } })

      expect(fetchMock).toHaveBeenCalledOnce()
      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/7', {
        method: 'PATCH',
        body: { activeIndex: 1, round: 2 },
      })
    })

    it('updates the cache and the combat log optimistically', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}))

      const { vm } = await mountUpdate()
      const other = { ...row, id: 'row-2', name: 'Goblin' }

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        round: 2,
        activeIndex: 0,
        rows: [row, other],
      })

      void vm.mutateAsync({ id: 7, data: { rows: [row] } })

      await vi.waitFor(() =>
        expect(
          vm.queryClient.getQueryData<InitiativeSheet>([
            'useInitiativeSheetDetail',
            7,
          ])?.rows,
        ).toEqual([row]),
      )

      expect(
        vm.queryClient.getQueryData<CombatEventRow[]>(['useCombatEvents', 7]),
      ).toEqual([
        expect.objectContaining({
          encounterId: 7,
          round: 2,
          rowId: 'row-2',
          type: 'row_removed',
          payload: { rowName: 'Goblin' },
        }),
      ])
    })

    it('keeps a change from a sync that arrives while the update is pending', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}))

      const { vm } = await mountUpdate()
      const other = { ...row, id: 'row-2', name: 'Goblin' }
      const synced = {
        id: 7,
        round: 2,
        activeIndex: 0,
        rows: [{ ...row, hitPoints: 3 }, other],
      } as InitiativeSheet

      void vm.mutateAsync({
        id: 7,
        data: { baseRows: [row, other], rows: [row] },
      })

      await vi.waitFor(() =>
        expect(withPendingEdits(vm.queryClient, 7, synced).rows).toEqual([
          { ...row, hitPoints: 3 },
        ]),
      )
    })

    it('leaves the combat log alone for an update without combat effect', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}))

      const { vm } = await mountUpdate()

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        round: 1,
        activeIndex: 0,
        rows: [row],
      })

      void vm.mutateAsync({ id: 7, data: { info: 'Ambush at dawn' } })

      await vi.waitFor(() =>
        expect(
          vm.queryClient.getQueryData<InitiativeSheet>([
            'useInitiativeSheetDetail',
            7,
          ])?.info,
        ).toBe('Ambush at dawn'),
      )

      expect(
        vm.queryClient.getQueryData(['useCombatEvents', 7]),
      ).toBeUndefined()
    })

    it('hands the caller its callbacks on success', async () => {
      fetchMock.mockResolvedValue({ updated: true })

      const { vm } = await mountUpdate()
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 7, data: { info: 'Renamed' }, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('rolls back the cache and the combat log and reports the error when the update fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountUpdate()
      const other = { ...row, id: 'row-2', name: 'Goblin' }

      vm.queryClient.setQueryData(['useInitiativeSheetDetail', 7], {
        id: 7,
        round: 1,
        activeIndex: 0,
        rows: [row, other],
      })
      vm.queryClient.setQueryData(['useCombatEvents', 7], [])

      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({ id: 7, data: { rows: [row] }, ...spies }),
      ).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(
        vm.queryClient.getQueryData<InitiativeSheet>([
          'useInitiativeSheetDetail',
          7,
        ])?.rows,
      ).toEqual([row, other])
      expect(vm.queryClient.getQueryData(['useCombatEvents', 7])).toEqual([])
    })

    it.each([
      [{ rows: [row] }, 'rows'],
      [{ rows: [row], activeIndex: 0, round: 1 }, 'rows'],
      [{ activeIndex: 2, round: 3 }, 'turn'],
      [{ settings: { modified: true } }, 'settings'],
      [{ infoCards: [] }, 'infoCards'],
      [{ info: 'Ambush at dawn' }, 'info'],
      [{}, 'generic'],
    ] as [UpdateInitiativeSheetData, string][])(
      'names what failed when a %o update fails',
      async (data, field) => {
        fetchMock.mockRejectedValue(new Error('boom'))

        const { vm } = await mountUpdate()

        await expect(vm.mutateAsync({ id: 7, data })).rejects.toThrow('boom')

        expect(toast.error).toHaveBeenCalledWith(
          `pages.encounter.toasts.updateFailed.${field}`,
          { description: 'general.error.reasons.rejected' },
        )
      },
    )

    it('explains a claimed row in the toast', async () => {
      fetchMock.mockRejectedValue(
        Object.assign(new Error('row-claimed'), {
          statusCode: 409,
          data: { statusMessage: 'row-claimed' },
        }),
      )

      const { vm } = await mountUpdate()

      await expect(
        vm.mutateAsync({ id: 7, data: { rows: [{ ...row, hidden: true }] } }),
      ).rejects.toThrow('row-claimed')

      expect(toast.error).toHaveBeenCalledWith(
        'pages.encounter.toasts.updateFailed.rows',
        { description: 'general.error.reasons.rowClaimed' },
      )
    })

    it('reports the error without a cached sheet to roll back to', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountUpdate()

      await expect(
        vm.mutateAsync({ id: 7, data: { info: 'Renamed' } }),
      ).rejects.toThrow('boom')

      expect(
        vm.queryClient.getQueryData(['useInitiativeSheetDetail', 7]),
      ).toBeUndefined()
    })
  })
})
