import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EncountersPage from '~/pages/encounters/index.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const EncountersStub = defineComponent({
  props: { campaignId: Number, fetchReady: Boolean },
  template: '<div data-test-encounters />',
})

const stubs = {
  Encounters: EncountersStub,
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(EncountersPage, { global: { stubs } })
}

describe('Encounters page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should render the encounters listing', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-encounters]').exists()).toBe(true)
  })

  it('Should let the listing fetch immediately', async () => {
    const component = await mountPage()

    expect(component.findComponent(EncountersStub).props('fetchReady')).toBe(
      true,
    )
  })

  it('Should not scope the listing to a campaign', async () => {
    const component = await mountPage()

    expect(
      component.findComponent(EncountersStub).props('campaignId'),
    ).toBeUndefined()
  })

  it('Should render inside the sidebar layout with the encounters header', async () => {
    const component = await mountPage()

    const layout = component.get('[data-test-layout]')

    expect(layout.attributes('data-test-layout')).toBe('sidebar')
    expect(layout.attributes('data-test-layout-header')).toBe(
      'general.encounter',
    )
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Encounters')
  })
})
