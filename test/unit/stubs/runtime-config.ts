import { vi } from 'vitest'
import { createError } from 'h3'

const hoisted = vi.hoisted(() => ({
  useRuntimeConfig: vi.fn<() => Record<string, unknown>>(() => ({
    public: {},
    stripeSk: 'sk_test_placeholder',
  })),
}))

export const { useRuntimeConfig } = hoisted

vi.mock('#app', () => ({
  createError,
  useRuntimeConfig,
}))

export function mockRuntimeConfig(config: Record<string, unknown>) {
  useRuntimeConfig.mockReturnValue(config)
}
