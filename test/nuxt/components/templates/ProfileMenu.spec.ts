import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import ProfileMenu from '~/components/templates/ProfileMenu.vue'

const userMock = ref<{ name: string } | null>(null)

vi.mock('~/composables/useAuthentication', () => ({
  useAuthentication: () => ({ user: userMock }),
}))

const routes: Route[] = [
  {
    label: 'general.dashboard',
    url: '/dashboard',
    requireAuth: false,
    icon: 'tabler:home',
  },
  {
    label: 'general.settings',
    url: '/settings',
    requireAuth: true,
    icon: 'tabler:settings',
  },
  { label: 'general.help', url: '/help', requireAuth: false },
]

function Wrapper() {
  return {
    components: { DropdownMenu, DropdownMenuTrigger, ProfileMenu },
    props: ['routes'],
    emits: ['logout'],
    template: `
      <DropdownMenu :open="true">
        <DropdownMenuTrigger test-id="trigger">Open</DropdownMenuTrigger>
        <ProfileMenu :routes="routes" @logout="$emit('logout')" />
      </DropdownMenu>
    `,
  }
}

describe('ProfileMenu', () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render a menu item for every route that does not require auth when logged out', async () => {
    userMock.value = null

    await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('general.dashboard')
    expect(document.body.textContent).toContain('general.help')
    expect(document.body.textContent).not.toContain('general.settings')
  })

  it('Should render menu items that require auth when logged in', async () => {
    userMock.value = { name: 'Test User' }

    await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('general.settings')
  })

  it('Should render the icon only for routes that define one', async () => {
    userMock.value = null

    await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    const items = document.body.querySelectorAll('[role="menuitem"]')
    const helpItem = Array.from(items).find(item =>
      item.textContent?.includes('general.help'),
    )

    expect(helpItem?.querySelector('.iconify')).toBeNull()
  })

  it('Should only show the logout button when a user is logged in', async () => {
    userMock.value = null

    const loggedOut = await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    expect(document.body.textContent).not.toContain('components.navbar.logout')
    loggedOut.unmount()

    userMock.value = { name: 'Test User' }

    await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('components.navbar.logout')
  })

  it('Should emit logout when the logout button is clicked', async () => {
    userMock.value = { name: 'Test User' }

    const component = await mountSuspended(Wrapper(), {
      props: { routes },
      attachTo: document.body,
    })

    const logoutButton = Array.from(
      document.body.querySelectorAll('button'),
    ).find(button => button.textContent?.includes('components.navbar.logout'))

    logoutButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(component.emitted('logout')).toBeTruthy()
  })
})
