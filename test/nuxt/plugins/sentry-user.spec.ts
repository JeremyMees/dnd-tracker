import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sentryUserPlugin from '~/plugins/sentry-user.client'
import { authUser } from '~~/test/fixtures/auth-user'

const { setUser } = vi.hoisted(() => ({ setUser: vi.fn() }))

vi.mock('@sentry/nuxt', () => ({ setUser }))
vi.unmock('~/plugins/sentry-user.client')

const user = ref<AuthUser | null>(null)
const consent = ref<string[]>([])

mockNuxtImport('useAuthentication', () => () => ({ user }))
mockNuxtImport('useHasConsent', () => () => consent)

const sentryUser = {
  id: authUser.id,
  email: authUser.email,
  username: authUser.username,
}

function runPlugin(): void {
  const nuxtApp = useNuxtApp()

  nuxtApp.runWithContext(() => sentryUserPlugin(nuxtApp))
}

describe('sentry-user plugin', () => {
  beforeEach(() => {
    user.value = null
    consent.value = ['necessary', 'measurement']
    setUser.mockReset()
  })

  it('clears the Sentry user when nobody is logged in', () => {
    runPlugin()

    expect(setUser).toHaveBeenCalledWith(null)
  })

  it('sets the Sentry user when a user is already logged in', () => {
    user.value = authUser

    runPlugin()

    expect(setUser).toHaveBeenCalledWith(sentryUser)
  })

  it('sets the Sentry user when the user logs in', async () => {
    runPlugin()

    user.value = authUser
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith(sentryUser)
  })

  it('clears the Sentry user when the user logs out', async () => {
    user.value = authUser
    runPlugin()

    user.value = null
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith(null)
  })

  it('does not send the user without measurement consent', () => {
    consent.value = ['necessary']
    user.value = authUser

    runPlugin()

    expect(setUser).toHaveBeenCalledOnce()
    expect(setUser).toHaveBeenCalledWith(null)
  })

  it('sets the Sentry user once measurement consent is given', async () => {
    consent.value = ['necessary']
    user.value = authUser
    runPlugin()

    consent.value = ['necessary', 'measurement']
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith(sentryUser)
  })

  it('clears the Sentry user when measurement consent is withdrawn', async () => {
    user.value = authUser
    runPlugin()

    consent.value = ['necessary']
    await nextTick()

    expect(setUser).toHaveBeenLastCalledWith(null)
  })
})
