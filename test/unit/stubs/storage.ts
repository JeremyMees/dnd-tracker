import { vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  const store = new Map<string, unknown>()

  return {
    store,
    useStorage: vi.fn((_base?: string) => ({
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: vi.fn((key: string, value: unknown) => {
        store.set(key, value)
        return Promise.resolve()
      }),
    })),
  }
})

export const { useStorage } = hoisted

vi.mock('nitropack/runtime', () => ({ useStorage }))

export function mockStorage() {
  hoisted.store.clear()
}
