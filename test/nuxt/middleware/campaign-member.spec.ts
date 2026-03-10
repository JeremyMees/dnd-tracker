import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/nuxt/fixtures/middleware'
import { authUser } from '~~/test/nuxt/fixtures/auth-user'
import middleware from '~/middleware/campaign-member'

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
        single: vi.fn(() => Promise.resolve(mockSupabaseResponse)),
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
mockNuxtImport('useLocalePath', () => vi.fn(() => (path: string) => path))

let mockUser: AuthUser | null = null

describe('Campaign member middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockSupabaseResponse = { data: null, error: null }
    mockQueryClient.getQueryData.mockReturnValue(null)
  })

  it('should navigate to / when title param is missing', async () => {
    await middleware(
      { ...mockTo, params: { id: '1' }, fullPath: '/campaigns/1' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is missing', async () => {
    await middleware(
      { ...mockTo, params: { title: 'test' }, fullPath: '/campaigns/test' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is not a number', async () => {
    await middleware(
      { ...mockTo, params: { title: 'test', id: 'abc' }, fullPath: '/campaigns/test/abc' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when getCampaign throws an error', async () => {
    mockSupabaseResponse.error = { message: 'Database error' }

    await middleware(
      { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to encounters when accessing index page', async () => {
    mockUser = { ...authUser, id: '1' }
    mockQueryClient.getQueryData.mockReturnValue({ created_by: '1', team: [], join_campaign: [] })

    await middleware(
      { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
  })

  describe('Encounters page access', () => {
    it('should allow viewer', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Viewer', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow admin', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Admin', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow owner', async () => {
      mockUser = { ...authUser, id: '1' }
      mockQueryClient.getQueryData.mockReturnValue({ created_by: '1', team: [], join_campaign: [] })

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('Settings page access', () => {
    it('should redirect viewer', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Viewer', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' },
        mockFrom,
      )

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should allow admin', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Admin', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow owner', async () => {
      mockUser = { ...authUser, id: '1' } as AuthUser
      const mockData = {
        created_by: '1',
        team: [],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('Danger-zone page access', () => {
    it('should redirect viewer', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Viewer', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' },
        mockFrom,
      )

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should redirect admin', async () => {
      mockUser = { ...authUser, id: '2' }
      const mockData = {
        created_by: '1',
        team: [{ role: 'Admin', user: '2' }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' },
        mockFrom,
      )

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should allow owner', async () => {
      mockUser = { ...authUser, id: '1' }
      const mockData = {
        created_by: '1',
        team: [],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(
        { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' },
        mockFrom,
      )

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  it('should navigate to /no-access when user is not a team member', async () => {
    mockUser = { ...authUser, id: '3' }
    const mockData = {
      created_by: '1',
      team: [{ role: 'Viewer', user: '2' }],
      join_campaign: [],
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(
      { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should fetch from supabase when not cached and allow access for owner', async () => {
    mockUser = { ...authUser, id: '1' }
    const mockData = {
      id: 1,
      created_by: '1',
      team: [],
      join_campaign: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware(
      { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
      mockFrom,
    )

    expect(mockSupabase.from).toHaveBeenCalledWith('campaigns')
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['useCampaignMember', 1], mockData)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should fetch from supabase when not cached and deny access', async () => {
    mockUser = { ...authUser, id: '3' }
    const mockData = {
      id: 1,
      created_by: '1',
      team: [{ role: 'Viewer', user: '2' }],
      join_campaign: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware(
      { ...mockTo, params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' },
      mockFrom,
    )

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })
})
