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
  useEncounterCopy,
  useEncounterCount,
  useEncounterCreate,
  useEncounterListing,
  useEncounterRemove,
  useEncounterUpdate,
} from '~/queries/encounters'

const encounterItem: EncounterItem = {
  id: 3,
  title: 'Goblin Ambush',
  createdAt: '2026-01-01T00:00:00.000Z',
  round: 1,
  activeIndex: 0,
  version: 0,
  rows: [],
  info: null,
  infoCards: [],
  createdBy: { id: '1', username: 'Test User', avatar: 'avatar-url' },
  campaign: {
    id: 2,
    title: 'The Lost Mine',
    createdBy: { id: '1', username: 'Test User', avatar: 'avatar-url' },
    team: [],
  },
  homebrew_items: 0,
  initiative_sheets: 0,
  settings: {
    spacing: 'normal',
    modified: false,
    rows: [],
    widgets: [],
    negative: false,
  },
}

describe('encounters queries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    await clearQueryCache()
  })

  describe('useEncounterListing', () => {
    it('maps the query result into amount, pages, and encounters with sub-counts', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({
          data: [
            {
              ...encounterItem,
              homebrew_items: [{ count: 2 }],
              initiative_sheets: [{ count: 4 }],
            },
          ],
          error: null,
          count: 1,
        }),
      })

      const { vm } = await mountHook(() =>
        useEncounterListing(
          computed(() => ({ page: 0 })),
          computed(() => true),
          10,
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({
        amount: 1,
        pages: 1,
        encounters: [
          expect.objectContaining({ homebrew_items: 2, initiative_sheets: 4 }),
        ],
      })
    })

    it('does not fetch while disabled', async () => {
      const from = mockSupabaseFrom({
        initiative_sheets: mockChain({ data: [], error: null, count: 0 }),
      })

      await mountHook(() =>
        useEncounterListing(
          computed(() => ({ page: 0 })),
          computed(() => false),
          10,
        ),
      )

      expect(from).not.toHaveBeenCalled()
    })
  })

  describe('useEncounterCount', () => {
    it('returns the count', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null, count: 5 }),
      })

      const { vm } = await mountHook(() =>
        useEncounterCount(computed(() => true)),
      )

      await vi.waitFor(() => expect(vm.data).toBe(5))
    })

    it('falls back to 0 when there is no count', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null, count: null }),
      })

      const { vm } = await mountHook(() =>
        useEncounterCount(computed(() => true)),
      )

      await vi.waitFor(() => expect(vm.data).toBe(0))
    })
  })

  describe('useEncounterCreate', () => {
    it('inserts the encounter and invalidates listing caches', async () => {
      const from = mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => ({
        ...useEncounterCreate(),
        queryClient: useQueryClient(),
      }))

      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')

      await vm.mutateAsync({ data: { title: 'New fight' } as InitiativeInsert })

      expect(from).toHaveBeenCalledWith('initiative_sheets')
      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { title: 'New fight' },
      ])
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useEncounterListing'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['useEncounterCount'],
      })
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('toasts an error when the insert fails', async () => {
      mockSupabaseFrom({
        initiative_sheets: mockChain({
          data: null,
          error: { message: 'boom' },
        }),
      })

      const { vm } = await mountHook(() => useEncounterCreate())
      const onError = vi.fn()

      await expect(
        vm.mutateAsync({
          data: { title: 'New fight' } as InitiativeInsert,
          onError,
        }),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useEncounterUpdate', () => {
    it('updates the encounter by id', async () => {
      const from = mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useEncounterUpdate())

      await vm.mutateAsync({ id: 3, data: { title: 'Renamed' } })

      const chain = from.mock.results[0]!.value

      expect(chain.update).toHaveBeenCalledWith({ title: 'Renamed' })
      expect(chain.eq).toHaveBeenCalledWith('id', 3)
    })
  })

  describe('useEncounterRemove', () => {
    it('deletes a single encounter through the server route', async () => {
      fetchMock.mockResolvedValue({ deleted: true })

      const { vm } = await mountHook(() => useEncounterRemove())

      await vm.mutateAsync({ id: 3 })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/3', {
        method: 'DELETE',
      })
    })

    it('deletes every id in bulk through the server route', async () => {
      fetchMock.mockResolvedValue({ deleted: true })

      const { vm } = await mountHook(() => useEncounterRemove())

      await vm.mutateAsync({ id: [3, 4] })

      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/3', {
        method: 'DELETE',
      })
      expect(fetchMock).toHaveBeenCalledWith('/api/encounter/4', {
        method: 'DELETE',
      })
    })

    it('reports an error and does not invalidate the listing when the delete fails', async () => {
      fetchMock.mockRejectedValue(new Error('boom'))

      const { vm } = await mountHook(() => ({
        ...useEncounterRemove(),
        queryClient: useQueryClient(),
      }))
      const invalidateSpy = vi.spyOn(vm.queryClient, 'invalidateQueries')
      const onError = vi.fn()

      await expect(vm.mutateAsync({ id: 3, onError })).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalled()
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  describe('useEncounterCopy', () => {
    it('inserts a copy with a prefixed title, owner, and campaign', async () => {
      const from = mockSupabaseFrom({
        initiative_sheets: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useEncounterCopy())

      await vm.mutateAsync({ data: encounterItem })

      const inserted = from.mock.results[0]!.value.insert.mock.calls[0]![0][0]

      expect(inserted.title).toBe('copy Goblin Ambush')
      expect(inserted.createdBy).toBe('1')
      expect(inserted.campaign).toBe(2)
      expect(inserted.id).toBeUndefined()
    })
  })
})
