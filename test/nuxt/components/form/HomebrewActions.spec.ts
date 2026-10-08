import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import * as z from 'zod'
import HomebrewActions from '~/components/form/HomebrewActions.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mountWithForm } from '~~/test/nuxt/stubs/form'

const action: DndAction = {
  actionType: 'action',
  name: 'Bite',
  desc: 'A nasty bite',
  attacks: [],
}

const dagger: DndAction = {
  actionType: 'action',
  name: 'Dagger',
  desc: 'Melee or ranged weapon attack',
  attacks: [
    {
      name: 'Dagger',
      attackType: 'melee',
      distanceUnit: 'feet',
      toHitMod: 4,
      reach: 5,
      damageDieCount: 1,
      damageDieType: 'd4',
      damageBonus: 2,
      damageType: 'piercing',
    },
  ],
}

const validationSchema = z.object({ actions: z.array(actionSchema) })

let wrapper: VueWrapper | undefined

async function mountHomebrewActions(
  initialValues: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  const mounted = await mountWithForm(HomebrewActions, {
    props,
    initialValues,
    validationSchema,
  })

  wrapper = mounted.component

  return mounted
}

function inputValue(name: string): string {
  return wrapper!.get<HTMLInputElement>(`input[name="${name}"]`).element.value
}

describe('HomebrewActions', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

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

  it('Should keep existing attacks bound to their action after adding one', async () => {
    const { component, form } = await mountHomebrewActions({
      actions: [dagger],
    })

    await component.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(inputValue('actions.1.attacks.0.name')).toBe('Dagger')
    expect(
      component.find('input[name="actions.0.attacks.0.name"]').exists(),
    ).toBe(false)
    expect(form.values.actions).toEqual([
      { actionType: 'action', name: '', desc: '', attacks: [] },
      dagger,
    ])
  })

  it('Should validate a bonus action added after an action with attacks', async () => {
    const { component, form } = await mountHomebrewActions({
      actions: [dagger],
    })

    await component.findAll('button')[0]!.trigger('click')
    await flushPromises()

    form.setFieldValue('actions.0.actionType', 'bonusAction')
    await component
      .get('input[name="actions.0.name"]')
      .setValue('Nimble Escape')
    await component
      .get('textarea[name="actions.0.desc"]')
      .setValue('The goblin takes the Disengage or Hide action.')

    const { valid, errors } = await form.validate()

    expect(errors).toEqual({})
    expect(valid).toBe(true)
  })

  it('Should keep attacks and action type fields bound after moving an action', async () => {
    const legendary: DndAction = {
      ...action,
      actionType: 'legendaryAction',
      legendaryActionCost: 2,
    }
    const { component, form } = await mountHomebrewActions({
      actions: [legendary, dagger],
    })

    await component.get('[test-id="move-down-0"]').trigger('click')
    await flushPromises()

    expect(inputValue('actions.0.attacks.0.name')).toBe('Dagger')
    expect(inputValue('actions.1.legendaryActionCost')).toBe('2')
    expect(
      component.find('input[name="actions.0.legendaryActionCost"]').exists(),
    ).toBe(false)
    expect(form.values.actions).toEqual([dagger, legendary])
  })
})
