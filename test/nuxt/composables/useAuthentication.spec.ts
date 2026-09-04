import { mockNuxtImport, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError as createH3Error, readBody } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAuthenticatedUser,
  useAuthentication,
} from '~/composables/useAuthentication'

const mockSignUp = vi.fn()
const mockCreateUser = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseFrom = vi.fn().mockReturnValue({
  select: mockSupabaseSelect,
  insert: vi.fn(),
})
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockGetUser = vi.fn().mockReturnValue({
  data: { user: { id: 'test-user-id' } },
})

let authStateChangeCallback: ((event: string) => void) | null = null

registerEndpoint('/api/user/create', {
  method: 'POST',
  handler: async event => mockCreateUser(await readBody(event)),
})

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    getUser: mockGetUser,
    onAuthStateChange: (callback: (event: string) => void) => {
      authStateChangeCallback = callback
      return mockOnAuthStateChange(callback)
    },
  },
  from: mockSupabaseFrom,
}))

const stateMap = new Map<string, Ref<unknown>>()

mockNuxtImport('useState', () => {
  return <T>(key: string, init?: () => T) => {
    if (!stateMap.has(key)) stateMap.set(key, ref(init ? init() : null))

    return stateMap.get(key) as Ref<T>
  }
})

mockNuxtImport(
  'createError',
  () => (error: string | { message?: string; details?: string }) => {
    return new Error(
      typeof error === 'string'
        ? error
        : error.message || error.details || 'Unknown error',
    )
  },
)

const email = 'test@example.com'
const password = 'password123'
const user = {
  name: 'Test User',
  username: 'testuser',
  marketing: false,
  avatar: 'avatar-url',
  avatarOptions: { color: 'blue' },
}

describe('useAuthentication', () => {
  let auth: ReturnType<typeof useAuthentication>

  beforeEach(() => {
    clearNuxtState()
    stateMap.clear()

    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
    mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
    mockGetUser.mockReturnValue({ data: { user: { id: 'test-user-id' } } })

    auth = useAuthentication()

    if (authStateChangeCallback) authStateChangeCallback('SIGNED_OUT')
  })

  it('should have the correct API', () => {
    expect(auth).toHaveProperty('user')
    expect(auth).toHaveProperty('register')
    expect(auth).toHaveProperty('login')
    expect(auth).toHaveProperty('logout')
    expect(auth).toHaveProperty('fetch')
  })

  describe('register', () => {
    const userData = { email, password, ...user }

    it('posts the registration to the server route', async () => {
      mockCreateUser.mockReturnValue({ id: 'new-user-id' })

      await auth.register(userData)

      expect(mockCreateUser).toHaveBeenCalledWith(userData)
      expect(mockSupabaseFrom().insert).not.toHaveBeenCalled()
    })

    it('never signs the user up from the client', async () => {
      mockCreateUser.mockReturnValue({ id: 'new-user-id' })

      await auth.register(userData)

      expect(mockSignUp).not.toHaveBeenCalled()
    })

    it('should throw a friendly error when the email is already in use', async () => {
      mockCreateUser.mockImplementation(() => {
        throw createH3Error({
          statusCode: 409,
          statusMessage: 'Email already in use',
        })
      })

      await expect(auth.register(userData)).rejects.toThrow(
        'Email already in use',
      )
    })

    it('should throw the original error for an unrelated failure', async () => {
      mockCreateUser.mockImplementation(() => {
        throw createH3Error({
          statusCode: 400,
          statusMessage: 'connection reset',
        })
      })

      await expect(auth.register(userData)).rejects.toThrow('connection reset')
    })
  })

  describe('login', () => {
    it('should successfully log in a user', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null })

      const credentials = { email, password }
      await auth.login(credentials)

      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    })

    it('should throw error if login fails', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      })

      const credentials = { email: 'wrong@example.com', password: 'wrong' }
      await expect(auth.login(credentials)).rejects.toThrow()

      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    })
  })

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      await auth.logout()

      expect(mockSignOut).toHaveBeenCalled()
      expect(auth.user.value).toBeNull()
    })

    it('should throw error if logout fails', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      })

      await expect(auth.logout()).rejects.toThrow()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('fetch', () => {
    it('should fetch user profile data', async () => {
      const mockUserData = {
        id: 'test-user-id',
        ...user,
      }

      mockSupabaseSingle.mockResolvedValue({
        data: mockUserData,
        error: null,
      })

      await auth.fetch()

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*')
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-user-id')
      expect(mockSupabaseSingle).toHaveBeenCalled()
      expect(auth.user.value).toEqual(mockUserData)
    })

    it('should handle missing user profile', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { details: 'Results contain 0 rows' },
      })

      mockSignOut.mockResolvedValue({ error: null })

      await expect(auth.fetch()).rejects.toThrow('Results contain 0 rows')

      expect(mockSignOut).toHaveBeenCalled()
    })

    it('should do nothing when there is no authenticated user', async () => {
      mockGetUser.mockReturnValue({ data: { user: null } })

      await auth.fetch()

      expect(mockSupabaseFrom).not.toHaveBeenCalled()
      expect(auth.user.value).toBeNull()
    })

    it('should not refetch a profile that was cached recently', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id', ...user },
        error: null,
      })

      await auth.fetch()

      expect(mockSupabaseSingle).toHaveBeenCalledTimes(1)

      await auth.fetch()

      expect(mockSupabaseSingle).toHaveBeenCalledTimes(1)
    })

    it('should refetch a cached profile when forceRefresh is set', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id', ...user },
        error: null,
      })

      await auth.fetch()

      expect(mockSupabaseSingle).toHaveBeenCalledTimes(1)

      await auth.fetch(true)

      expect(mockSupabaseSingle).toHaveBeenCalledTimes(2)
    })
  })

  describe('onAuthStateChange', () => {
    it('should fetch user data on SIGNED_IN event', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id' },
        error: null,
      })

      if (authStateChangeCallback) authStateChangeCallback('SIGNED_IN')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
    })

    it('should fetch user data on USER_UPDATED event', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id' },
        error: null,
      })

      if (authStateChangeCallback) authStateChangeCallback('USER_UPDATED')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
    })
  })

  describe('useAuthenticatedUser', () => {
    it('should throw when there is no authenticated user', () => {
      expect(() => useAuthenticatedUser().value).toThrow(
        'useAuthenticatedUser() can only be used in protected pages',
      )
    })

    it('should return the authenticated user', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id', ...user },
        error: null,
      })

      await auth.fetch()

      expect(useAuthenticatedUser().value).toEqual(auth.user.value)
    })
  })
})
