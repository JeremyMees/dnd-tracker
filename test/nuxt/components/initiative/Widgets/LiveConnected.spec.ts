import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LiveConnected from '~/components/initiative/Widgets/LiveConnected.vue'
import { authUser } from '~~/test/fixtures/auth-user'

const { start } = vi.hoisted(() => ({ start: vi.fn() }))

const user = ref<AuthUser>({ ...authUser })
const session = ref<{ token: string; code: string; expiresAt: string }>()
const active = ref(false)

mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useLiveSession', () => () => ({ session, active, start }))
mockNuxtImport('useLiveSeats', () => () => ({
  seats: ref([]),
  connected: ref(new Set()),
  kick: vi.fn(),
  reassign: vi.fn(),
}))

const props = { encounterId: 1, rows: [] }

describe('LiveConnected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user.value = { ...authUser, subscriptionType: 'free' }
    session.value = undefined
    active.value = false
  })

  it('Should render nothing when there is no active session', async () => {
    const component = await mountSuspended(LiveConnected, { props })

    expect(component.find('[test-id="live-connected"]').exists()).toBe(false)
  })

  it('Should render the connected seat list when a session is active', async () => {
    active.value = true

    const component = await mountSuspended(LiveConnected, { props })

    expect(component.find('[test-id="live-connected"]').exists()).toBe(true)
  })

  it('Should check for a session on mount without creating one', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    await mountSuspended(LiveConnected, { props })

    expect(start).toHaveBeenCalledWith({ createIfMissing: false })
  })

  it('Should not start the session on mount when the user is not pro', async () => {
    await mountSuspended(LiveConnected, { props })

    expect(start).not.toHaveBeenCalled()
  })
})
