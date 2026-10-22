import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/fixtures/middleware'
import middleware from '~/middleware/authenticated.global'

const sessionUser = ref<{ id: string } | null>(null)
const profile = ref<Partial<ProfileRow> | null>(null)
const fetchProfile = vi.fn()

mockNuxtImport('useSupabaseUser', () => vi.fn(() => sessionUser))
mockNuxtImport('useAuthentication', () =>
  vi.fn(() => ({ user: profile, fetch: fetchProfile })),
)
mockNuxtImport('navigateTo', () => vi.fn())

const protectedRoute = { ...mockTo, meta: { auth: true } }

describe('Authenticated middleware', () => {
  beforeEach(() => {
    sessionUser.value = null
    profile.value = null
    fetchProfile.mockReset()
    vi.mocked(navigateTo).mockClear()
  })

  it('should do nothing on public routes', async () => {
    await middleware(mockTo, mockFrom)

    expect(navigateTo).not.toHaveBeenCalled()
    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('should redirect to login without a session', async () => {
    await middleware(protectedRoute, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('should not refetch when the profile is already loaded', async () => {
    sessionUser.value = { id: '1' }
    profile.value = { id: '1' }

    await middleware(protectedRoute, mockFrom)

    expect(fetchProfile).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should wait for the profile when the session exists but the profile is not loaded yet', async () => {
    sessionUser.value = { id: '1' }
    fetchProfile.mockImplementation(async () => {
      profile.value = { id: '1' }
    })

    await middleware(protectedRoute, mockFrom)

    expect(fetchProfile).toHaveBeenCalledOnce()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should redirect to login when the profile cannot be loaded', async () => {
    sessionUser.value = { id: '1' }

    await middleware(protectedRoute, mockFrom)

    expect(fetchProfile).toHaveBeenCalledOnce()
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })
})
