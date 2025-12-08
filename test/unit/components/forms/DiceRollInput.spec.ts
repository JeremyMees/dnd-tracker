import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DiceRollInput from '~/components/form/DiceRollInput'
import DiceRoller from '~/components/atoms/DiceRoller'

describe('DiceRollInput', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(DiceRollInput)
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render number input by default', async () => {
    const component = await mountSuspended(DiceRollInput)
    const input = component.find('input')

    expect(input.attributes('type')).toBe('number')
  })

  it('Should toggle dice roller visibility', async () => {
    const component = await mountSuspended(DiceRollInput)
    const button = component.find('button')

    expect(component.find('[data-test-roller]').exists()).toBeFalsy()
    await button.trigger('click')

    expect(component.find('[data-test-roller]').exists()).toBeTruthy()
    await button.trigger('click')

    expect(component.find('[data-test-roller]').exists()).toBeFalsy()
  })

  it('Should set input value and close roller when DiceRoller emits', async () => {
    const component = await mountSuspended(DiceRollInput)
    const button = component.find('button')
    await button.trigger('click')
    const roller = component.findComponent(DiceRoller)
    await roller.vm.$emit('rolled', 42)
    await component.vm.$nextTick()
    const input = component.find('input')

    expect([input.element.value, input.element.valueAsNumber]).toContain(42)
    expect(component.findComponent(DiceRoller).exists()).toBeFalsy()
  })
})
