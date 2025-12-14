import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import middleware from '@/middleware/encounter-access.ts'

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
    const to = { params: { id: '1' } }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is missing', async () => {
    const to = { params: { title: 'test' } }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when id param is not a number', async () => {
    const to = { params: { title: 'test', id: 'abc' } }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should navigate to / when getEncounter throws an error', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockSupabaseResponse.error = { message: 'Database error' }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should allow access when user is the campaign owner', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 1 } as AuthUser
    const mockData = {
      campaign: { created_by: { id: 1 } },
      team: [],
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should allow access when user is the direct owner', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 1 } as AuthUser
    const mockData = {
      created_by: 1,
      campaign: null,
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should allow access when user is a team member', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 2 } as AuthUser
    const mockData = {
      campaign: {
        created_by: { id: 1 },
        team: [{ user: { id: 2 } }],
      },
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should navigate to /no-access when no campaign is associated', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 1 } as AuthUser
    const mockData = {
      created_by: 2,
      campaign: null,
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should navigate to /no-access when user is not a team member', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 3 } as AuthUser
    const mockData = {
      campaign: {
        created_by: { id: 1 },
        team: [{ user: { id: 2 } }],
      },
    }
    mockQueryClient.getQueryData.mockReturnValue(mockData)

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })

  it('should fetch from supabase when not cached and allow access for owner', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 1 } as AuthUser
    const mockData = {
      campaign: { created_by: { id: 1 } },
      team: [],
    }
    mockSupabaseResponse.data = mockData

    await middleware(to)

    expect(mockSupabase.from).toHaveBeenCalledWith('initiative_sheets')
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['useInitiativeSheetDetail', 1], mockData)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should fetch from supabase when not cached and deny access', async () => {
    const to = { params: { title: 'test', id: '1' } }
    mockUser = { id: 3 } as AuthUser
    const mockData = {
      campaign: {
        created_by: { id: 1 },
        team: [{ user: { id: 2 } }],
      },
    }
    mockSupabaseResponse.data = mockData

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
  })
})
