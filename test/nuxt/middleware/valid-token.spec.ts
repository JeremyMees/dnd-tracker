import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/fixtures/middleware'
import middleware from '~/middleware/valid-token'

vi.mock('@tanstack/vue-query', async importOriginal => {
  const actual = await importOriginal<typeof import('@tanstack/vue-query')>()
  return { ...actual, useQueryClient: vi.fn(() => mockQueryClient) }
})

const singleMock = vi.fn()

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      match: vi.fn(() => ({
        single: singleMock,
      })),
    })),
  })),
}

const mockQueryClient = {
  setQueryData: vi.fn(),
}

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useSupabaseClient', () => vi.fn(() => mockSupabase))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Valid Token middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    singleMock.mockReset()
    fetchMock.mockReset()
  })

  it('should redirect to home when no token', async () => {
    await middleware(mockTo, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to home when token is not a string', async () => {
    // @ts-expect-error - Error is expected to be thrown, but we need a number for the test
    const query = { token: 123 as LocationQueryValue }

    await middleware({ ...mockTo, query }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should throw when $fetch fails', async () => {
    const query = { token: 'invalid' }

    fetchMock.mockRejectedValue(new Error('Invalid token'))

    await expect(middleware({ ...mockTo, query }, mockFrom)).rejects.toThrow(
      'Invalid token',
    )
  })

  it('should redirect to no-access when supabase query fails', async () => {
    const query = { token: 'valid' }

    fetchMock.mockResolvedValue({ campaign: 1, user: 2, role: 'member' })
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    await middleware({ ...mockTo, query }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should set query data on success', async () => {
    const query = { token: 'valid' }
    const mockData = {
      id: 1,
      role: 'member',
      user: 2,
      campaign: { id: 1, title: 'Test' },
    }

    fetchMock.mockResolvedValue({ campaign: 1, user: 2, role: 'member' })
    singleMock.mockResolvedValue({ data: mockData, error: null })

    await middleware({ ...mockTo, query }, mockFrom)

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['useJoinCampaign', 'valid'],
      mockData,
    )
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
