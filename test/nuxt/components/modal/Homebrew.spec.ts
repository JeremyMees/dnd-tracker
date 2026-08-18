import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomebrewModal from '~/components/modal/Homebrew.vue'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'

const FormHomebrewStub = defineComponent({
  props: { campaignId: Number, count: Number, item: Object },
  emits: ['close'],
  template: '<div test-id="form-homebrew" />',
})

const stubs = { FormHomebrew: FormHomebrewStub }

function mountHomebrewModal(item?: HomebrewItemRow) {
  return mountSuspended(HomebrewModal, {
    props: { campaignId: 1, count: 3, item },
    global: { stubs },
  })
}

describe('Homebrew modal', () => {
  it('Should match snapshot', async () => {
    const component = await mountHomebrewModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the homebrew form', async () => {
    const component = await mountHomebrewModal()

    expect(component.find('[test-id="form-homebrew"]').exists()).toBe(true)
  })

  it('Should pass the campaignId and count through', async () => {
    const component = await mountHomebrewModal()

    const form = component.findComponent(FormHomebrewStub)

    expect(form.props('campaignId')).toBe(1)
    expect(form.props('count')).toBe(3)
  })

  it('Should pass an undefined item when creating', async () => {
    const component = await mountHomebrewModal()

    expect(
      component.findComponent(FormHomebrewStub).props('item'),
    ).toBeUndefined()
  })

  it('Should pass the item through when editing', async () => {
    const component = await mountHomebrewModal(mockHomebrewItem)

    expect(component.findComponent(FormHomebrewStub).props('item')).toEqual(
      mockHomebrewItem,
    )
  })

  it('Should forward close when the form emits it', async () => {
    const component = await mountHomebrewModal()

    await component.findComponent(FormHomebrewStub).vm.$emit('close')

    expect(component.emitted('close')).toBeTruthy()
  })
})
