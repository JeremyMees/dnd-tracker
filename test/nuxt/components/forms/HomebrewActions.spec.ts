import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomebrewActions from '~/components/form/HomebrewActions.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

const action: DndAction = {
  actionType: 'action',
  name: 'Bite',
  desc: 'A nasty bite',
  attacks: [],
}

function mountHomebrewActions(
  initialValues: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  return mountWithForm(HomebrewActions, { props, initialValues })
}

describe('HomebrewActions', () => {
  it('Should match snapshot', async () => {
    const { component } = await mountHomebrewActions()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the actions repeater with an empty state', async () => {
    const { component } = await mountHomebrewActions()

    expect(component.text()).toContain('components.inputs.actionsLabel')
    expect(component.text()).toContain('components.repeaterInput.noItems')
  })

  it('Should render the action inputs per action', async () => {
    const { component } = await mountHomebrewActions({ actions: [action] })

    expect(component.text()).toContain('components.inputs.actionTypeLabel')
    expect(
      component.get<HTMLInputElement>('input[name="actions.0.name"]').element
        .value,
    ).toBe('Bite')
  })

  it('Should add an empty action through the repeater', async () => {
    const { component, form } = await mountHomebrewActions({ actions: [] })

    await component.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(form.values.actions).toEqual([
      { actionType: 'action', name: '', desc: '', attacks: [] },
    ])
  })

  it('Should render the same fields with a sheet', async () => {
    const { component } = await mountHomebrewActions(
      { actions: [action] },
      { sheet },
    )

    expect(component.text()).toContain('components.inputs.actionsLabel')
    expect(
      component.get<HTMLInputElement>('input[name="actions.0.name"]').element
        .value,
    ).toBe('Bite')
  })
})
