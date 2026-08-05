import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FantasyNameGeneratorPage from '~/pages/fantasy-name-generator.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const GeneratorStub = defineComponent({
  props: ['amount', 'compact'],
  template: '<div data-test-generator />',
})

const stubs = {
  FantasyNameGenerator: GeneratorStub,
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(FantasyNameGeneratorPage, { global: { stubs } })
}

describe('Fantasy name generator page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should render the generator', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-generator]').exists()).toBe(true)
  })

  it('Should ask the generator for 30 names', async () => {
    const component = await mountPage()

    expect(component.findComponent(GeneratorStub).props('amount')).toBe(30)
  })

  it('Should render the generator in its full size', async () => {
    const component = await mountPage()

    expect(component.findComponent(GeneratorStub).props('compact')).toBeFalsy()
  })

  it('Should render inside the sidebar layout with the fantasy header', async () => {
    const component = await mountPage()

    const layout = component.get('[data-test-layout]')

    expect(layout.attributes('data-test-layout')).toBe('sidebar')
    expect(layout.attributes('data-test-layout-header')).toBe(
      'components.navbar.fantasy',
    )
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Fantasy name generator')
  })
})
