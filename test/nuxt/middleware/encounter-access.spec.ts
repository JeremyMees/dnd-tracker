import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/nuxt/fixtures/middleware'
import { authUser } from '~~/test/nuxt/fixtures/auth-user'
import middleware from '~/middleware/encounter-access'

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}))

const mockQueryClient = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
}

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          overrideTypes: vi.fn(() => mockSupabaseResponse),
        })),
      })),
    })),
  })),
}

let mockSupabaseResponse: { data: any, error: any }

mockNuxtImport('useState', () => vi.fn((key: string) => {
  if (key === 'auth-user') return { value: mockUser }
  return { value: null }
}))
mockNuxtImport('navigateTo', () => vi.fn())
mockNuxtImport('useSupabaseClient', () => vi.fn(() => mockSupabase))
mockNuxtImport('createError', () => vi.fn((error: any) => new Error(error.message)))

let mockUser: AuthUser | null = null

describe('Encounter access middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockSupabaseResponse = { data: null, error: null }
    mockQueryClient.getQueryData.mockReturnValue(null)
  })

  it('should navigate to / when title param is missing', async () => {
    await middleware({ ...mockTo, params: { id: '1' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is missing', async () => {
    await middleware({ ...mockTo, params: { title: 'test' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is not a number', async () => {
    await middleware({ ...mockTo, params: { title: 'test', id: 'abc' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when getEncounter throws an error', async () => {
    mockSupabaseResponse.error = { message: 'Database error' }

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should allow access when user is the campaign owner', async () => {
    mockUser = { ...authUser, id: '1' }
    const mockData = {
      campaign: { createdBy: { id: '1' } },
      team: [],
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should allow access when user is the direct owner', async () => {
    mockUser = { ...authUser, id: '1' }
    const mockData = {
      createdBy: '1',
      campaign: null,
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should allow access when user is a team member', async () => {
    mockUser = { ...authUser, id: '2' }
    const mockData = {
      campaign: {
        createdBy: { id: '1' },
        team: [{ user: { id: '2' } }],
      },
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should navigate to /no-access when no campaign is associated', async () => {
    mockUser = { ...authUser, id: '1' }
    const mockData = {
      createdBy: '2',
      campaign: null,
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should navigate to /no-access when user is not a team member', async () => {
    mockUser = { ...authUser, id: '3' }
    const mockData = {
      campaign: {
        createdBy: { id: '1' },
        team: [{ user: { id: '2' } }],
      },
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should fetch from supabase when not cached and allow access for owner', async () => {
    mockUser = { ...authUser, id: '1' }
    const mockData = {
      campaign: { createdBy: { id: '1' } },
      team: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(mockSupabase.from).toHaveBeenCalledWith('initiative_sheets')
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['useInitiativeSheetDetail', 1], mockData)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should fetch from supabase when not cached and deny access', async () => {
    mockUser = { ...authUser, id: '3' }
    const mockData = {
      campaign: {
        createdBy: { id: '1' },
        team: [{ user: { id: '2' } }],
      },
    }
    mockSupabaseResponse.data = mockData

    await middleware({ ...mockTo, params: { title: 'test', id: '1' } }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })
})
