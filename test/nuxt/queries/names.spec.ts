import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import {
  clearQueryCache,
  fetchMock,
  mountHook,
  toast,
} from '~~/test/nuxt/stubs/query'
import { useRandomName, useRandomNames } from '~/queries/names'

let mounted: VueWrapper | undefined

async function mount<T extends Record<string, unknown>>(
  setupFn: () => T | Promise<T>,
) {
  const result = await mountHook(setupFn)

  mounted = result.component as unknown as VueWrapper

  return result
}

function request(index = 0) {
  const [url, options] = fetchMock.mock.calls[index]!

  return { url, query: options?.query as Record<string, unknown> | undefined }
}

describe('names queries', () => {
  beforeEach(async () => {
    fetchMock.mockReset()
    toast.mockReset()
    clearNuxtState()
    await clearQueryCache()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  describe('useRandomNames', () => {
    it('returns the generated names untouched', async () => {
      fetchMock.mockResolvedValue(['Alfa Beta', 'Gamma Delta'])

      const { vm } = await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 2,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      expect(vm.data).toEqual(['Alfa Beta', 'Gamma Delta'])
    })

    it('calls our own names endpoint', async () => {
      fetchMock.mockResolvedValue([])

      await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 10,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      expect(request().url).toBe('/api/names')
    })

    it('strips the random sentinel the endpoint would reject', async () => {
      fetchMock.mockResolvedValue([])

      await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 30,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      expect(request().query).toEqual({ amount: 30 })
    })

    it('narrows generation once a race and gender are picked', async () => {
      fetchMock.mockResolvedValue([])

      await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 5,
            race: 'elf' as const,
            gender: 'female' as const,
          })),
        ),
      )

      expect(request().query).toEqual({
        amount: 5,
        race: 'elf',
        gender: 'female',
      })
    })

    it('refetches with the new filters when the selection changes', async () => {
      fetchMock.mockResolvedValue([])

      const race = ref<DndRace | 'random'>('random')

      await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 5,
            race: race.value,
            gender: 'random' as const,
          })),
        ),
      )

      race.value = 'dwarf'

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

      expect(request(1).query).toMatchObject({ race: 'dwarf' })
    })

    it('asks for fresh names instead of replaying a cached list', async () => {
      fetchMock.mockResolvedValue(['Alfa Beta'])

      const { vm } = await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 1,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.data).toBeDefined())

      fetchMock.mockResolvedValue(['Gamma Delta'])

      await vm.refetch()

      expect(vm.data).toEqual(['Gamma Delta'])
    })

    it('toasts and rethrows when the endpoint fails', async () => {
      fetchMock.mockRejectedValue(new Error('nope'))

      const { vm } = await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 1,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })

    it('does not retry a failed generation', async () => {
      fetchMock.mockRejectedValue(new Error('nope'))

      const { vm } = await mount(() =>
        useRandomNames(
          computed(() => ({
            amount: 1,
            race: 'random' as const,
            gender: 'random' as const,
          })),
        ),
      )

      await vi.waitFor(() => expect(vm.isError).toBe(true))

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('useRandomName', () => {
    it('returns the single generated name', async () => {
      fetchMock.mockResolvedValue(['Alfa Beta'])

      const { vm } = await mount(() => useRandomName())

      await expect(vm.mutateAsync()).resolves.toBe('Alfa Beta')
    })

    it('asks the endpoint for one name', async () => {
      fetchMock.mockResolvedValue(['Alfa Beta'])

      const { vm } = await mount(() => useRandomName())

      await vm.mutateAsync()

      expect(request().url).toBe('/api/names')
      expect(request().query).toBeUndefined()
    })

    it('resolves to undefined when the endpoint returns nothing', async () => {
      fetchMock.mockResolvedValue([])

      const { vm } = await mount(() => useRandomName())

      await expect(vm.mutateAsync()).resolves.toBeUndefined()
    })

    it('toasts when the endpoint fails', async () => {
      fetchMock.mockRejectedValue(new Error('nope'))

      const { vm } = await mount(() => useRandomName())

      await expect(vm.mutateAsync()).rejects.toThrow('nope')

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' }),
      )
    })
  })
})
