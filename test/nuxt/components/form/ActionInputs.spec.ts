import { describe, expect, it } from 'vitest'
import ActionInputs from '~/components/form/ActionInputs.vue'
import { mountWithForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

async function mountActionInputs(
  actionType: DndActionType = 'action',
  usageLimits?: DndUsageLimits,
) {
  const { component } = await mountWithForm(ActionInputs, {
    props: { fieldName: 'action' },
    initialValues: { action: { actionType, usageLimits } },
  })

  return component
}

describe('ActionInputs', () => {
  it('Should match snapshot', async () => {
    const component = await mountActionInputs()
    expect(component.html()).toMatchSnapshot()
  })

  it('Should always render actionType, name and desc fields', async () => {
    const component = await mountActionInputs()
    const html = component.html()

    expect(html).toContain('components.inputs.actionTypeLabel')
    expect(html).toContain('components.inputs.nameLabel')
    expect(html).toContain('components.inputs.descriptionLabel')
  })

  it('Should always render limitedToForm and usage type fields', async () => {
    const component = await mountActionInputs()
    const html = component.html()

    expect(html).toContain('components.inputs.limitedToFormLabel')
    expect(html).toContain('components.inputs.usageTypeLabel')
  })

  describe('Legendary action cost', () => {
    it('Should not show legendary action cost for regular action types', async () => {
      for (const type of [
        'action',
        'bonusAction',
        'reaction',
        'specialAbility',
        'lairAction',
      ] as DndActionType[]) {
        const component = await mountActionInputs(type)
        expect(component.html()).not.toContain(
          'components.inputs.legendaryActionCostLabel',
        )
      }
    })

    it('Should show legendary action cost for legendaryAction', async () => {
      const component = await mountActionInputs('legendaryAction')
      expect(component.html()).toContain(
        'components.inputs.legendaryActionCostLabel',
      )
    })

    it('Should show legendary action cost for mythicAction', async () => {
      const component = await mountActionInputs('mythicAction')
      expect(component.html()).toContain(
        'components.inputs.legendaryActionCostLabel',
      )
    })
  })

  describe('Usage param', () => {
    it('Should not show usage param when no usage type is set', async () => {
      const component = await mountActionInputs('action', undefined)
      expect(component.html()).not.toContain(
        'components.inputs.usageParamLabel',
      )
    })

    it('Should not show usage param for atWill (no count needed)', async () => {
      const component = await mountActionInputs('action', {
        type: 'atWill',
        param: 1,
      })
      expect(component.html()).not.toContain(
        'components.inputs.usageParamLabel',
      )
    })

    it('Should show usage param for perDay', async () => {
      const component = await mountActionInputs('action', {
        type: 'perDay',
        param: 3,
      })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })

    it('Should show usage param for recharge', async () => {
      const component = await mountActionInputs('action', {
        type: 'recharge',
        param: 5,
      })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })

    it('Should show usage param for perRest', async () => {
      const component = await mountActionInputs('action', {
        type: 'perRest',
        param: 2,
      })
      expect(component.html()).toContain('components.inputs.usageParamLabel')
    })
  })

  describe('handleUsageTypeChange', () => {
    it('Should clear usage limits when the type is set to none', async () => {
      const component = await mountActionInputs('action', {
        type: 'perDay',
        param: 3,
      })

      await selectOption(component, 'none', { index: 1 })

      expect(component.html()).not.toContain(
        'components.inputs.usageParamLabel',
      )
    })

    it('Should default the param to 1 when no usage limits existed before', async () => {
      const component = await mountActionInputs('action', undefined)

      await selectOption(component, 'perDay', { index: 1 })

      expect(
        (component.get('[test-id="usage-param"]').element as HTMLInputElement)
          .value,
      ).toBe('1')
    })

    it('Should keep the existing param when switching usage types', async () => {
      const component = await mountActionInputs('action', {
        type: 'perDay',
        param: 5,
      })

      await selectOption(component, 'perRest', { index: 1 })

      expect(
        (component.get('[test-id="usage-param"]').element as HTMLInputElement)
          .value,
      ).toBe('5')
    })
  })

  describe('handleUsageParamChange', () => {
    it('Should update the usage param when the input changes', async () => {
      const component = await mountActionInputs('action', {
        type: 'perDay',
        param: 3,
      })

      await component.get('[test-id="usage-param"]').setValue(7)

      expect(
        (component.get('[test-id="usage-param"]').element as HTMLInputElement)
          .value,
      ).toBe('7')
    })
  })

  describe('Attacks repeater', () => {
    it('Should render attack inputs for an existing attack', async () => {
      const { component } = await mountWithForm(ActionInputs, {
        props: { fieldName: 'action' },
        initialValues: {
          action: {
            actionType: 'action',
            attacks: [{ name: '', attackType: 'melee', distanceUnit: 'feet' }],
          },
        },
      })

      expect(component.html()).toContain('components.inputs.attackTypeLabel')
    })
  })
})
