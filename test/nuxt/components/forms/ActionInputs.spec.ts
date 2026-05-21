import { defineComponent } from 'vue'
import { useForm } from 'vee-validate'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ActionInputs from '~/components/form/ActionInputs.vue'

function mountWithForm(actionType: DndActionType = 'action', usageLimits?: DndUsageLimits) {
  const Wrapper = defineComponent({
    components: { FormActionInputs: ActionInputs },
    setup() {
      useForm({ initialValues: { action: { actionType, usageLimits } } })
    },
    template: '<FormActionInputs field-name="action" />',
  })
  return mountSuspended(Wrapper)
}

describe('ActionInputs', () => {
  it('Should match snapshot', async () => {
    const component = await mountWithForm()
    expect(component.html()).toMatchSnapshot()
  })

  it('Should always render actionType, name and desc fields', async () => {
    const component = await mountWithForm()
    const html = component.html()

    expect(html).toContain('components.inputs.actionTypeLabel')
    expect(html).toContain('components.inputs.nameLabel')
    expect(html).toContain('components.inputs.descriptionLabel')
  })

  it('Should always render limitedToForm and usage type fields', async () => {
    const component = await mountWithForm()
    const html = component.html()

    expect(html).toContain('components.inputs.limitedToFormLabel')
    expect(html).toContain('components.inputs.usageTypeLabel')
  })

  describe('Legendary action cost', () => {
    it('Should not show legendary action cost for regular action types', async () => {
      for (const type of ['action', 'bonusAction', 'reaction', 'specialAbility', 'lairAction'] as DndActionType[]) {
        const component = await mountWithForm(type)
        expect(component.html()).not.toContain('components.inputs.legendaryActionCostLabel')
      }
    })

    it('Should show legendary action cost for legendaryAction', async () => {
      const component = await mountWithForm('legendaryAction')
      expect(component.html()).toContain('components.inputs.legendaryActionCostLabel')
    })

    it('Should show legendary action cost for mythicAction', async () => {
      const component = await mountWithForm('mythicAction')
      expect(component.html()).toContain('components.inputs.legendaryActionCostLabel')
    })
  })

  describe('Usage param', () => {
    it('Should not show usage param when no usage type is set', async () => {
      const component = await mountWithForm('action', undefined)
      expect(component.html()).not.toContain('components.inputs.usageParamLabel')
    })

    it('Should not show usage param for atWill (no count needed)', async () => {
      const component = await mountWithForm('action', { type: 'atWill', param: 1 })
      expect(component.html()).not.toContain('components.inputs.usageParamLabel')
    })

    it('Should show usage param for perDay', async () => {
      const component = await mountWithForm('action', { type: 'perDay', param: 3 })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })

    it('Should show usage param for recharge', async () => {
      const component = await mountWithForm('action', { type: 'recharge', param: 5 })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })

    it('Should show usage param for perRest', async () => {
      const component = await mountWithForm('action', { type: 'perRest', param: 2 })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })
  })
})
