import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/nuxt/fixtures/middleware'
import middleware from '~/middleware/encounter-share-access'

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}))

const mockQueryClient = {
  setQueryData: vi.fn(),
  removeQueries: vi.fn(),
}

mockNuxtImport('navigateTo', () => vi.fn())
mockNuxtImport('createError', () => vi.fn(message => new Error(message)))

describe('Encounter share access middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return early when no token in query', async () => {
    await middleware(mockTo, mockFrom)

    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should set query data when fetch succeeds with encounter', async () => {
    const mockEncounter = { id: 1, name: 'Test Encounter' }

    // @ts-expect-error - Error is expected to be thrown, but we want to mock the response for the test
    global.$fetch = vi.fn().mockResolvedValue(mockEncounter)

    await middleware({ ...mockTo, query: { token: 'valid-token' } }, mockFrom)

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
    // @ts-expect-error - Error is expected to be thrown, but we want to mock the response for the test
    global.$fetch = vi.fn().mockResolvedValue(null)

    await middleware({ ...mockTo, query: { token: 'invalid-token' } }, mockFrom)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'invalid-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('should remove queries and navigate on fetch error', async () => {
    // @ts-expect-error - Error is expected to be thrown, but we want to mock the response for the test
    global.$fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'))

    await middleware({ ...mockTo, query: { token: 'error-token' } }, mockFrom)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'error-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })
})
