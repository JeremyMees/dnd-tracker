import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import Navbar from '~/components/templates/Navbar.vue'

const logoutMock = vi.fn()
const toastMock = vi.fn()
const userMock = { name: 'Test User', avatar: '/avatar.png' }

interface NavbarVm {
  logoutUser: () => Promise<void>
  isOpen: boolean
  isScrolled: boolean
}

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
    const vm = component.vm as unknown as NavbarVm

    await vm.logoutUser()

    expect(logoutMock).toHaveBeenCalled()
    expect(vm.isOpen).toBeFalsy()
  })

  it('Should show toast on logout error', async () => {
    const component = await mountSuspended(Navbar)

    logoutMock.mockRejectedValueOnce(new Error('fail'))
    const vm = component.vm as unknown as NavbarVm

    await vm.logoutUser()

    expect(toastMock).toHaveBeenCalled()
  })

  it('Should set isScrolled on scroll', async () => {
    const component = await mountSuspended(Navbar)
    const vm = component.vm as unknown as NavbarVm

    window.scrollY = 20
    // @ts-expect-error - Error is expected to be thrown
    window?.onscroll?.()
    expect(vm.isScrolled).toBeTruthy()
    window.scrollY = 0
    // @ts-expect-error - Error is expected to be thrown
    window?.onscroll?.()
    expect(vm.isScrolled).toBeFalsy()
  })
})
