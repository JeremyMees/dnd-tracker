import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthentication } from '~/composables/useAuthentication'
import type { Login, Register } from '~/types/forms'

const mockSignUp = vi.fn()
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

let authStateChangeCallback: ((event: string) => void) | null = null

mockNuxtImport('useSupabaseClient', () => () => ({
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    onAuthStateChange: (callback: (event: string) => void) => {
      authStateChangeCallback = callback
      return mockOnAuthStateChange(callback)
    },
  },
  from: mockSupabaseFrom,
}))

mockNuxtImport('useState', () => <T>(key: string, init: () => T) => ref(init()))

mockNuxtImport('useSupabaseUser', () => () => ref({ id: 'test-user-id' }))

mockNuxtImport('createError', () => (error: any) => {
  throw new Error(
    typeof error === 'string'
      ? error
      : error.message || error.details || 'Unknown error',
  )
})

const email = 'test@example.com'
const password = 'password123'
const user = {
  name: 'Test User',
  username: 'testuser',
  marketing: false,
  avatar: 'avatar-url',
  avatar_options: { color: 'blue' },
}

describe('useAuthentication', () => {
  let auth: ReturnType<typeof useAuthentication>

  beforeEach(() => {
    vi.clearAllMocks()
    clearNuxtState()

    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
    mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })

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
    it('should successfully register a user', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      })

      mockSupabaseFrom().insert.mockResolvedValue({ error: null })

      const userData: Register = { email, password, ...user }

      await auth.register(userData)

      expect(mockSignUp).toHaveBeenCalledWith({ email, password })

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseFrom().insert).toHaveBeenCalledWith([{
        ...user,
        email,
        id: 'new-user-id',
      }])
    })

    it('should throw error if registration fails', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'Registration failed' },
      })

      const userData: Register = { email, password, ...user }

      await expect(auth.register(userData)).rejects.toThrow()
      expect(mockSignUp).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should successfully log in a user', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null })

      const credentials: Login = { email, password }
      await auth.login(credentials)

      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    })

    it('should throw error if login fails', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      })

      const credentials: Login = { email: 'wrong@example.com', password: 'wrong' }
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
  })

  describe('onAuthStateChange', () => {
    it('should fetch user data on SIGNED_IN event', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id' },
        error: null,
      })

      if (authStateChangeCallback) authStateChangeCallback('SIGNED_IN')

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
    })

    it('should fetch user data on USER_UPDATED event', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { id: 'test-user-id' },
        error: null,
      })

      if (authStateChangeCallback) authStateChangeCallback('USER_UPDATED')

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')
    })
  })
})
