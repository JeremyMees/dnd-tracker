import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/fixtures/middleware'
import middleware from '~/middleware/encounter-share-access'

vi.mock('@tanstack/vue-query', async importOriginal => {
  const actual = await importOriginal<typeof import('@tanstack/vue-query')>()
  return { ...actual, useQueryClient: vi.fn(() => mockQueryClient) }
})

const mockQueryClient = {
  setQueryData: vi.fn(),
  removeQueries: vi.fn(),
}

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('navigateTo', () => vi.fn())
mockNuxtImport('createError', () => vi.fn(message => new Error(message)))

describe('Encounter share access middleware', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('should return early when no token in query', async () => {
    await middleware(mockTo, mockFrom)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
    expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should set query data when fetch succeeds with encounter', async () => {
    const mockEncounter = { id: 1, name: 'Test Encounter' }

    fetchMock.mockResolvedValue(mockEncounter)

    await middleware({ ...mockTo, query: { token: 'valid-token' } }, mockFrom)

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/share', {
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
    fetchMock.mockResolvedValue(null)

    await middleware({ ...mockTo, query: { token: 'invalid-token' } }, mockFrom)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'invalid-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('should remove queries and navigate on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('Fetch failed'))

    await middleware({ ...mockTo, query: { token: 'error-token' } }, mockFrom)

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetPlayground', 'error-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })
})
