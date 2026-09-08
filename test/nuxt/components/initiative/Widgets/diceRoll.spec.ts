import { describe, expect, it } from 'vitest'
import DiceRollWidget from '~/components/initiative/Widgets/DiceRoll.vue'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

describe('Initiative dice roll widget', async () => {
  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(DiceRollWidget)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the DiceRoller component', async () => {
    const component = await mountWithTooltips(DiceRollWidget)

    expect(
      component.findComponent({ name: 'DiceRoller' }).exists(),
    ).toBeTruthy()
  })

  it('Should pass styled false to DiceRoller', async () => {
    const component = await mountWithTooltips(DiceRollWidget)
    const inner = component.findComponent({ name: 'DiceRoller' })

    expect(inner.props('styled')).toBe(false)
  })

  it('Should render the Card with id tour-2', async () => {
    const component = await mountWithTooltips(DiceRollWidget)

    expect(component.find('#tour-2').exists()).toBeTruthy()
  })

  it('Should render the Card with secondary color', async () => {
    const component = await mountWithTooltips(DiceRollWidget)
    const card = component.findComponent({ name: 'Card' })

    expect(card.props('color')).toBe('secondary')
  })
})
