import { describe, expect, it, vi, afterEach } from 'vitest'
import user from '../fixtures/user.json'
import { useAuthentication } from '~/composables/useAuthentication'
import { useUi } from '~/composables/useUi'

vi.mock('~/composables/useAuthentication')

describe('useUi', async () => {
  const loggedOutRoutes = 2
  const routes = 2
  const loggedInPlayRoutes = 2
  const playRoutes = 3
  const updateProfileRoutes = 1
  const profileRoutes = 3

  afterEach(() => vi.clearAllMocks())

  const createAuthMock = (userData: any) => ({
    user: ref(userData),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    fetch: vi.fn(),
  })

  it('Should show the correct routes when logged out', async () => {
    vi.mocked(useAuthentication).mockReturnValue(createAuthMock(null))

    const ui = useUi()

    expect(ui.routes.value.length).toBe(loggedOutRoutes + routes)
    expect(ui.playRoutes.value.length).toBe(playRoutes)
  })

  it('Should show the correct routes when logged in', async () => {
    vi.mocked(useAuthentication).mockReturnValue(createAuthMock(user))

    const ui = useUi()

    expect(ui.routes.value.length).toBe(routes)
    expect(ui.playRoutes.value.length).toBe(playRoutes + loggedInPlayRoutes)
    expect(ui.profileRoutes.value.length).toBe(profileRoutes + updateProfileRoutes)
  })

  it('Should not show the upgrade cta when the user is a pro', async () => {
    vi.mocked(useAuthentication).mockReturnValue(createAuthMock({ ...user, subscription_type: 'pro' }))

    const ui = useUi()

    expect(ui.profileRoutes.value.length).toBe(profileRoutes)
  })
})
