import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DnDContentPage from '~/pages/dnd-content.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = {
  DnDContentSearch: {
    template: '<div data-test-search />',
  },
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(DnDContentPage, { global: { stubs } })
}

describe('DnD content page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should render the content search', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-search]').exists()).toBe(true)
  })

  it('Should render inside the sidebar layout with the dnd content header', async () => {
    const component = await mountPage()

    const layout = component.get('[data-test-layout]')

    expect(layout.attributes('data-test-layout')).toBe('sidebar')
    expect(layout.attributes('data-test-layout-header')).toBe(
      'components.navbar.dnd-content',
    )
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('DnD Content')
  })
})
