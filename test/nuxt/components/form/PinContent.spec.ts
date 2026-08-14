import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PinContent from '~/components/form/PinContent.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'

const DnDContentSearchStub = defineComponent({
  props: {
    variant: String,
    sheet: Object,
    update: Function,
    allowPin: Boolean,
  },
  template: '<div test-id="content-search" />',
})

const stubs = { DnDContentSearch: DnDContentSearchStub }

function mountPinContent({ withSheet = true } = {}) {
  const injected = createInitiativeSheetProvide(withSheet ? sheet : null)

  return {
    injected,
    mount: () =>
      mountSuspended(PinContent, {
        provide: injected.provide,
        global: { stubs },
      }),
  }
}

describe('PinContent', () => {
  it('Should match snapshot', async () => {
    const component = await mountPinContent().mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the content search', async () => {
    const component = await mountPinContent().mount()

    expect(component.find('[test-id="content-search"]').exists()).toBeTruthy()
  })

  it('Should pass the injected sheet and update through', async () => {
    const { injected, mount } = mountPinContent()
    const component = await mount()

    const search = component.findComponent(DnDContentSearchStub)

    expect(search.props('sheet')).toEqual(sheet)
    expect(search.props('update')).toBe(injected.update)
  })

  it('Should always allow pinning from the secondary variant', async () => {
    const component = await mountPinContent().mount()

    const search = component.findComponent(DnDContentSearchStub)

    expect(search.props('allowPin')).toBe(true)
    expect(search.props('variant')).toBe('secondary')
  })

  it('Should pass an undefined sheet through', async () => {
    const component = await mountPinContent({ withSheet: false }).mount()

    expect(
      component.findComponent(DnDContentSearchStub).props('sheet'),
    ).toBeUndefined()
  })
})
