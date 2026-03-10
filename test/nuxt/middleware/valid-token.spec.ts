import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '@/middleware/valid-token.ts'

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}))

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

mockNuxtImport('useSupabaseClient', () => vi.fn(() => mockSupabase))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Valid Token middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    singleMock.mockReset()
  })

  it('should redirect to home when no token', async () => {
    const query = {}

    await middleware({ query })

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to home when token is not a string', async () => {
    const query = { token: 123 }

    await middleware({ query })

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should throw when $fetch fails', async () => {
    const query = { token: 'invalid' }

    global.$fetch = vi.fn().mockRejectedValue(new Error('Invalid token'))

    await expect(middleware({ query })).rejects.toThrow('Invalid token')
  })

  it('should redirect to no-access when supabase query fails', async () => {
    const query = { token: 'valid' }

    global.$fetch = vi.fn().mockResolvedValue({ campaign: 1, user: 2, role: 'member' })
    singleMock.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    await middleware({ query })

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should set query data on success', async () => {
    const query = { token: 'valid' }
    const mockData = { id: 1, role: 'member', user: 2, campaign: { id: 1, title: 'Test' } }

    global.$fetch = vi.fn().mockResolvedValue({ campaign: 1, user: 2, role: 'member' })
    singleMock.mockResolvedValue({ data: mockData, error: null })

    await middleware({ query })

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['useJoinCampaign', 'valid'], mockData)
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
