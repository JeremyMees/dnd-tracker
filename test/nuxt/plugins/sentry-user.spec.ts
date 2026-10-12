import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sentryUserPlugin from '~/plugins/sentry-user.client'
import { authUser } from '~~/test/fixtures/auth-user'

const { setUser } = vi.hoisted(() => ({ setUser: vi.fn() }))

vi.mock('@sentry/nuxt', () => ({ setUser }))

const user = ref<AuthUser | null>(null)

mockNuxtImport('useAuthentication', () => () => ({ user }))

function runPlugin(): void {
  const nuxtApp = useNuxtApp()

  nuxtApp.runWithContext(() => sentryUserPlugin(nuxtApp))
}

describe('sentry-user plugin', () => {
  beforeEach(() => {
    user.value = null
    setUser.mockReset()
  })

  it('clears the Sentry user when nobody is logged in', () => {
    runPlugin()

    expect(setUser).toHaveBeenCalledWith(null)
  })

  it('sets the Sentry user when a user is already logged in', () => {
    user.value = authUser

    runPlugin()

    expect(setUser).toHaveBeenCalledWith({
      id: authUser.id,
      email: authUser.email,
      username: authUser.username,
    })
  })

  it('sets the Sentry user when the user logs in', async () => {
    runPlugin()

    user.value = authUser
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith({
      id: authUser.id,
      email: authUser.email,
      username: authUser.username,
    })
  })

  it('clears the Sentry user when the user logs out', async () => {
    user.value = authUser
    runPlugin()

    user.value = null
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith(null)
  })
})
