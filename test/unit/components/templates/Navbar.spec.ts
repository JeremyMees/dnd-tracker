import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import Navbar from '~/components/templates/Navbar.vue'

const logoutMock = vi.fn()
const toastMock = vi.fn()
const userMock = { name: 'Test User', avatar: '/avatar.png' }

vi.mock('~/composables/useAuthentication', () => ({
  useAuthentication: () => ({ user: userMock, logout: logoutMock }),
}))

vi.mock('~/composables/useUi', () => ({
  useUi: () => ({
    playRoutes: [{ label: 'play1', url: '/play1' }],
    routes: [{ label: 'home', url: '/' }],
    profileRoutes: [{ label: 'profile', url: '/profile', requireAuth: true }],
  }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }))

const isSmallMock = ref(false)
vi.mock('~/composables/useMediaQuery', () => ({ useMediaQuery: () => isSmallMock }))

describe('Navbar', async () => {
  beforeEach(() => {
    logoutMock.mockClear()
    toastMock.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Navbar)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should call logout on logoutUser', async () => {
    const component = await mountSuspended(Navbar)
    await component.vm.logoutUser()

    expect(logoutMock).toHaveBeenCalled()
    expect(component.vm.isOpen).toBe(false)
  })

  it('Should show toast on logout error', async () => {
    const component = await mountSuspended(Navbar)

    logoutMock.mockRejectedValueOnce(new Error('fail'))
    await component.vm.logoutUser()

    expect(toastMock).toHaveBeenCalled()
  })

  it('Should set isScrolled on scroll', async () => {
    const component = await mountSuspended(Navbar)

    window.scrollY = 20
    window?.onscroll?.()
    expect(component.vm.isScrolled).toBe(true)
    window.scrollY = 0
    window?.onscroll?.()
    expect(component.vm.isScrolled).toBe(false)
  })
})
