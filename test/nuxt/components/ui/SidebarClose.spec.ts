import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  SidebarClose,
  SidebarProvider,
  useSidebar,
} from '~/components/ui/sidebar'

function stubViewport(mobile: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: mobile,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

const OpenMobileProbe = defineComponent({
  setup() {
    const { openMobile, setOpenMobile } = useSidebar()

    setOpenMobile(true)

    return () =>
      h('span', { 'test-id': 'open-mobile' }, String(openMobile.value))
  },
})

async function mountWithProvider() {
  return await mountSuspended(SidebarProvider, {
    slots: {
      default: () => [h(SidebarClose), h(OpenMobileProbe)],
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SidebarClose', () => {
  it('renders on mobile so the sheet can be closed without the trigger', async () => {
    stubViewport(true)

    const component = await mountWithProvider()

    expect(component.find('[test-id="sidebar-close"]').exists()).toBe(true)
  })

  it('is not rendered on desktop', async () => {
    stubViewport(false)

    const component = await mountWithProvider()

    expect(component.find('[test-id="sidebar-close"]').exists()).toBe(false)
  })

  it('closes the mobile sidebar on click', async () => {
    stubViewport(true)

    const component = await mountWithProvider()

    expect(component.get('[test-id="open-mobile"]').text()).toBe('true')

    await component.get('[test-id="sidebar-close"]').trigger('click')

    expect(component.get('[test-id="open-mobile"]').text()).toBe('false')
  })
})
