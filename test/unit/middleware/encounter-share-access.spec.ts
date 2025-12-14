import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '@/middleware/encounter-share-access.ts'

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}))

const mockQueryClient = {
  setQueryData: vi.fn(),
  removeQueries: vi.fn(),
}

mockNuxtImport('navigateTo', () => vi.fn())
mockNuxtImport('createError', () => vi.fn(message => new Error(message)))

describe('encounter-share-access middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return early when no token in query', async () => {
    const to = { query: {} }

    await middleware(to)

    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should set query data when fetch succeeds with encounter', async () => {
    const to = { query: { token: 'valid-token' } }
    const mockEncounter = { id: 1, name: 'Test Encounter' }

    global.$fetch = vi.fn().mockResolvedValue(mockEncounter)

    await middleware(to)

    expect(global.$fetch).toHaveBeenCalledWith('/api/encounter/share', {
      query: { token: 'valid-token' },
    })
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['useInitiativeSheetPlayground', 'valid-token'],
      mockEncounter,
    )
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should remove queries and navigate when fetch succeeds but no encounter', async () => {
    const to = { query: { token: 'invalid-token' } }

    global.$fetch = vi.fn().mockResolvedValue(null)

    await middleware(to)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'invalid-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('should remove queries and navigate on fetch error', async () => {
    const to = { query: { token: 'error-token' } }

    global.$fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'))

    await middleware(to)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'error-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })
})
