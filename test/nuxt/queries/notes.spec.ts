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
  useNoteCount,
  useNoteCreate,
  useNoteListing,
  useNoteRemove,
  useNoteUpdate,
} from '~/queries/notes'

describe('notes queries', () => {
  beforeEach(async () => {
    await clearQueryCache()
  })

  describe('useNoteListing', () => {
    it('maps the query result', async () => {
      mockSupabaseFrom({
        notes: mockChain({
          data: [{ id: 1, title: 'Session 1' }],
          error: null,
          count: 1,
        }),
      })

      const { vm } = await mountHook(() =>
        useNoteListing(
          computed(() => ({ page: 0 })),
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual({
        amount: 1,
        pages: 1,
        notes: [{ id: 1, title: 'Session 1' }],
      })
    })

    it('does not fetch while disabled', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: [], error: null, count: 0 }),
      })

      await mountHook(() =>
        useNoteListing(
          computed(() => ({ page: 0 })),
          computed(() => false),
        ),
      )

      expect(from).not.toHaveBeenCalled()
    })
  })

  describe('useNoteCount', () => {
    it('scopes the count to the campaign', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: null, error: null, count: 6 }),
      })

      const { vm } = await mountHook(() =>
        useNoteCount(
          2,
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBe(6))

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('campaign', 2)
    })

    it('reports no notes when the count comes back empty', async () => {
      mockSupabaseFrom({
        notes: mockChain({ data: null, error: null, count: null }),
      })

      const { vm } = await mountHook(() =>
        useNoteCount(
          2,
          computed(() => true),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBe(0))
    })
  })

  describe('useNoteCreate', () => {
    it('inserts the note and invalidates caches', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useNoteCreate())

      await vm.mutateAsync({ data: { title: 'Session 1' } as NoteInsert })

      expect(from.mock.results[0]!.value.insert).toHaveBeenCalledWith([
        { title: 'Session 1' },
      ])
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ notes: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useNoteCreate())
      const spies = mutationSpies()

      await vm.mutateAsync({
        data: { title: 'Session 1' } as NoteInsert,
        ...spies,
      })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
      expect(spies.onError).not.toHaveBeenCalled()
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        notes: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useNoteCreate())
      const spies = mutationSpies()

      await expect(
        vm.mutateAsync({
          data: { title: 'Session 1' } as NoteInsert,
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
  })

  describe('useNoteUpdate', () => {
    it('updates the note by id', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useNoteUpdate())

      await vm.mutateAsync({ id: 8, data: { title: 'Renamed' } })

      const chain = from.mock.results[0]!.value

      expect(chain.update).toHaveBeenCalledWith({ title: 'Renamed' })
      expect(chain.eq).toHaveBeenCalledWith('id', 8)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('hands the caller its callbacks on success', async () => {
      mockSupabaseFrom({ notes: mockChain({ data: null, error: null }) })

      const { vm } = await mountHook(() => useNoteUpdate())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: 8, data: { title: 'Renamed' }, ...spies })

      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('toasts on failure even without callbacks', async () => {
      mockSupabaseFrom({
        notes: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useNoteUpdate())

      await expect(
        vm.mutateAsync({ id: 8, data: { title: 'Renamed' } }),
      ).rejects.toThrow('boom')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })

  describe('useNoteRemove', () => {
    it('deletes a single note', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useNoteRemove())

      await vm.mutateAsync({ id: 8 })

      expect(from.mock.results[0]!.value.eq).toHaveBeenCalledWith('id', 8)
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })

    it('deletes multiple notes', async () => {
      const from = mockSupabaseFrom({
        notes: mockChain({ data: null, error: null }),
      })

      const { vm } = await mountHook(() => useNoteRemove())
      const spies = mutationSpies()

      await vm.mutateAsync({ id: [8, 9], ...spies })

      expect(from.mock.results[0]!.value.in).toHaveBeenCalledWith('id', [8, 9])
      expect(spies.onSuccess).toHaveBeenCalledOnce()
      expect(spies.onSettled).toHaveBeenCalledWith(undefined)
    })

    it('reports an error and toasts on failure', async () => {
      mockSupabaseFrom({
        notes: mockChain({ data: null, error: { message: 'boom' } }),
      })

      const { vm } = await mountHook(() => useNoteRemove())
      const spies = mutationSpies()

      await expect(vm.mutateAsync({ id: 8, ...spies })).rejects.toThrow('boom')

      expect(spies.onError).toHaveBeenCalledWith('boom')
      expect(spies.onSettled).toHaveBeenCalledWith('boom')
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
