import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sessionPlugin from '~/plugins/session.client'
import { authUser } from '~~/test/fixtures/auth-user'

vi.unmock('~/plugins/session.client')

const user = ref<AuthUser | null>(null)
const fetchProfile = vi.fn()
const onAuthStateChange = vi.fn()

mockNuxtImport('useAuthentication', () => () => ({
  user,
  fetch: fetchProfile,
}))
mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { onAuthStateChange },
}))

async function runPlugin(): Promise<void> {
  const nuxtApp = useNuxtApp()

  await nuxtApp.runWithContext(() => sessionPlugin(nuxtApp))
}

function emit(event: string): void {
  for (const [callback] of onAuthStateChange.mock.calls) callback(event)
}

describe('session plugin', () => {
  beforeEach(() => {
    user.value = null
    fetchProfile.mockReset().mockResolvedValue(undefined)
    onAuthStateChange.mockReset()
  })

  it('registers a single auth listener', async () => {
    await runPlugin()

    expect(onAuthStateChange).toHaveBeenCalledOnce()
  })

  it.each(['SIGNED_IN', 'USER_UPDATED'])(
    'fetches the profile on %s',
    async event => {
      user.value = authUser
      await runPlugin()
      fetchProfile.mockClear()

      emit(event)

      expect(fetchProfile).toHaveBeenCalledOnce()
    },
  )

  it('fetches the profile on INITIAL_SESSION when none is loaded', async () => {
    await runPlugin()
    fetchProfile.mockClear()

    emit('INITIAL_SESSION')

    expect(fetchProfile).toHaveBeenCalledOnce()
  })

  it('does not refetch on INITIAL_SESSION when the profile is loaded', async () => {
    user.value = authUser
    await runPlugin()
    fetchProfile.mockClear()

    emit('INITIAL_SESSION')

    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('ignores other auth events', async () => {
    await runPlugin()
    fetchProfile.mockClear()

    emit('TOKEN_REFRESHED')
    emit('SIGNED_OUT')

    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('does not leave a rejected profile fetch unhandled', async () => {
    const rejection = Promise.reject(new Error('TypeError: Failed to fetch'))
    const handled = vi.spyOn(rejection, 'catch')
    await runPlugin()
    fetchProfile.mockReturnValue(rejection)

    emit('SIGNED_IN')

    expect(handled).toHaveBeenCalledOnce()
  })
})
