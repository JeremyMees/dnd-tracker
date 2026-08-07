import { vi } from 'vitest'

export const mockFetch = vi.fn()

globalThis.$fetch = mockFetch as unknown as typeof globalThis.$fetch
