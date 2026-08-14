import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import Navbar from '~/components/templates/Navbar.vue'

const logoutMock = vi.fn()
const toastMock = vi.fn()
const userMock = ref<{ name: string; avatar: string } | null>({
  name: 'Test User',
  avatar: '/avatar.png',
})

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
    playRoutes: [
      { label: 'play1', url: '/play1', icon: 'tabler:play' },
      { label: 'play2', url: '/play2' },
    ],
    routes: [
      { label: 'home', url: '/', icon: 'tabler:home' },
      { label: 'about', url: '/about' },
    ],
    profileRoutes: [
      {
        label: 'profile',
        url: '/profile',
        requireAuth: true,
        icon: 'tabler:user',
      },
      { label: 'public', url: '/public', requireAuth: false },
    ],
  }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

const isSmallMock = ref(false)
vi.mock('~/composables/useMediaQuery', () => ({
  useMediaQuery: () => isSmallMock,
}))

const openStub = { template: '<div><slot /></div>' }
const stubs = {
  NavigationMenuContent: openStub,
  NavigationMenuLink: openStub,
  DropdownMenuContent: openStub,
  DropdownMenuItem: openStub,
}

async function mountNavbar() {
  const component = await mountSuspended(Navbar, { global: { stubs } })
  await flushPromises()

  return component
}

describe('Navbar', () => {
  beforeEach(() => {
    logoutMock.mockClear()
    toastMock.mockClear()
    isSmallMock.value = false
    userMock.value = { name: 'Test User', avatar: '/avatar.png' }
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

  it('Should add a background once the page is scrolled and remove it again', async () => {
    const component = await mountSuspended(Navbar)
    const vm = component.vm as unknown as NavbarVm

    window.scrollY = 20
    // @ts-expect-error - Error is expected to be thrown
    window?.onscroll?.()
    await nextTick()
    expect(vm.isScrolled).toBeTruthy()
    expect(component.get('[test-id="nav"]').classes()).toContain(
      'bg-background/80',
    )

    window.scrollY = 0
    // @ts-expect-error - Error is expected to be thrown
    window?.onscroll?.()
    await nextTick()
    expect(vm.isScrolled).toBeFalsy()
    expect(component.get('[test-id="nav"]').classes()).toContain(
      'bg-transparent',
    )
  })

  it('Should render a desktop nav link for every route', async () => {
    const component = await mountNavbar()

    const links = component.findAll('[test-id="nav-route"]')

    expect(links).toHaveLength(2)
    expect(links[0]!.text()).toContain('home')
    expect(links[1]!.text()).toContain('about')
  })

  it('Should render every play route inside the play menu', async () => {
    const component = await mountNavbar()

    const links = component.findAll('[test-id="nav-play-route"]')

    expect(links).toHaveLength(2)
    expect(links[0]!.find('.iconify').exists()).toBe(true)
    expect(links[1]!.find('.iconify').exists()).toBe(false)
  })

  it('Should only show auth-gated profile routes when logged in', async () => {
    userMock.value = null

    const loggedOut = await mountNavbar()

    expect(loggedOut.findAll('[test-id="nav-profile-route"]')).toHaveLength(1)
    expect(loggedOut.find('[test-id="nav-logout"]').exists()).toBe(false)
    loggedOut.unmount()

    userMock.value = { name: 'Test User', avatar: '/avatar.png' }

    const loggedIn = await mountNavbar()

    expect(loggedIn.findAll('[test-id="nav-profile-route"]')).toHaveLength(2)
    expect(loggedIn.find('[test-id="nav-logout"]').exists()).toBe(true)
  })

  it('Should style the avatar for a logged out visitor', async () => {
    userMock.value = null

    const component = await mountSuspended(Navbar)

    expect(component.find('.border-muted-foreground').exists()).toBe(true)
  })

  it('Should call logoutUser when the desktop logout button is clicked', async () => {
    const component = await mountNavbar()

    await component.get('[test-id="nav-logout"]').trigger('click')
    await flushPromises()

    expect(logoutMock).toHaveBeenCalled()
  })

  it('Should render a mobile menu item for every route and highlight icons when provided', async () => {
    const component = await mountNavbar()

    const links = component.findAll('[test-id="mobile-route"]')

    expect(links).toHaveLength(2)
    expect(links[0]!.find('.iconify').exists()).toBe(true)
    expect(links[1]!.find('.iconify').exists()).toBe(false)
  })

  it('Should render every play route inside the mobile menu', async () => {
    const component = await mountNavbar()

    expect(component.findAll('[test-id="mobile-play-route"]')).toHaveLength(2)
  })

  it('Should only show auth-gated profile routes in the mobile menu when logged in', async () => {
    userMock.value = null

    const loggedOut = await mountNavbar()

    expect(loggedOut.findAll('[test-id="mobile-profile-route"]')).toHaveLength(
      1,
    )
    expect(loggedOut.find('[test-id="mobile-logout"]').exists()).toBe(false)
    loggedOut.unmount()

    userMock.value = { name: 'Test User', avatar: '/avatar.png' }

    const loggedIn = await mountNavbar()

    expect(loggedIn.findAll('[test-id="mobile-profile-route"]')).toHaveLength(2)
    expect(loggedIn.find('[test-id="mobile-logout"]').exists()).toBe(true)
  })

  it('Should call logoutUser when the mobile logout button is clicked', async () => {
    const component = await mountNavbar()

    await component.get('[test-id="mobile-logout"]').trigger('click')
    await flushPromises()

    expect(logoutMock).toHaveBeenCalled()
  })
})
