import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/fixtures/middleware'
import middleware from '~/middleware/live-access'

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

describe('Live access middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  it('should return early when no code in query', async () => {
    await middleware(mockTo, mockFrom)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('should cache the session when the code is valid', async () => {
    const session = { code: 'ABC234', expiresAt: '2026-01-01T00:00:00.000Z' }

    fetchMock.mockResolvedValue(session)

    await middleware({ ...mockTo, query: { code: 'ABC234' } }, mockFrom)

    expect(fetchMock).toHaveBeenCalledWith('/api/live/code', {
      query: { code: 'ABC234' },
    })
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['useLiveCode', 'ABC234'],
      session,
    )
  })

  it('should cache the status code when the fetch fails', async () => {
    fetchMock.mockRejectedValue({ statusCode: 410 })

    await middleware({ ...mockTo, query: { code: 'ZZZZZZ' } }, mockFrom)

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['useLiveCodeError', 'ZZZZZZ'],
      410,
    )
  })

  it('should default to a 500 status code when the error has none', async () => {
    fetchMock.mockRejectedValue(new Error('boom'))

    await middleware({ ...mockTo, query: { code: 'ZZZZZZ' } }, mockFrom)

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['useLiveCodeError', 'ZZZZZZ'],
      500,
    )
  })
})
