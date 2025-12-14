import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '@/middleware/campaign-member.ts'

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
    const to = { params: { id: '1' }, fullPath: '/campaigns/1' }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is missing', async () => {
    const to = { params: { title: 'test' }, fullPath: '/campaigns/test' }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is not a number', async () => {
    const to = { params: { title: 'test', id: 'abc' }, fullPath: '/campaigns/test/abc' }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when getCampaign throws an error', async () => {
    const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
    mockSupabaseResponse.error = { message: 'Database error' }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to encounters when accessing index page', async () => {
    const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1' }
    mockUser = { id: 1 } as AuthUser
    mockQueryClient.getQueryData.mockReturnValue({ created_by: 1, team: [], join_campaign: [] })

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
  })

  describe('Encounters page access', () => {
    it('should allow viewer', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Viewer', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow admin', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Admin', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow owner', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
      mockUser = { id: 1 } as AuthUser
      mockQueryClient.getQueryData.mockReturnValue({ created_by: 1, team: [], join_campaign: [] })

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('Settings page access', () => {
    it('should redirect viewer', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Viewer', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should allow admin', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Admin', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should allow owner', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/settings' }
      mockUser = { id: 1 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('Danger-zone page access', () => {
    it('should redirect viewer', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Viewer', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should redirect admin', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' }
      mockUser = { id: 2 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [{ role: 'Admin', user: 2 }],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).toHaveBeenCalledWith('/campaigns/test/1/encounters')
    })

    it('should allow owner', async () => {
      const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/danger-zone' }
      mockUser = { id: 1 } as AuthUser
      const mockData = {
        created_by: 1,
        team: [],
        join_campaign: [],
      }
      mockQueryClient.getQueryData.mockReturnValue(mockData)

      await middleware(to)

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  it('should navigate to /no-access when user is not a team member', async () => {
    const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
    mockUser = { id: 3 } as AuthUser
    const mockData = {
      created_by: 1,
      team: [{ role: 'Viewer', user: 2 }],
      join_campaign: [],
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should fetch from supabase when not cached and allow access for owner', async () => {
    const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
    mockUser = { id: 1 } as AuthUser
    const mockData = {
      id: 1,
      created_by: 1,
      team: [],
      join_campaign: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware(to)

    expect(mockSupabase.from).toHaveBeenCalledWith('campaigns')
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['useCampaignMember', 1], mockData)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should fetch from supabase when not cached and deny access', async () => {
    const to = { params: { title: 'test', id: '1' }, fullPath: '/campaigns/test/1/encounters' }
    mockUser = { id: 3 } as AuthUser
    const mockData = {
      id: 1,
      created_by: 1,
      team: [{ role: 'Viewer', user: 2 }],
      join_campaign: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })
})
