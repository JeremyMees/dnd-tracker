import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FantasyNameGeneratorWidget from '~/components/initiative/Widgets/FantasyNameGenerator.vue'

describe('Initiative fantasy name generator widget', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(FantasyNameGeneratorWidget)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the FantasyNameGenerator component', async () => {
    const component = await mountSuspended(FantasyNameGeneratorWidget)

    expect(component.findComponent({ name: 'FantasyNameGenerator' }).exists()).toBeTruthy()
  })

  it('Should pass amount 10 to FantasyNameGenerator', async () => {
    const component = await mountSuspended(FantasyNameGeneratorWidget)
    const inner = component.findComponent({ name: 'FantasyNameGenerator' })

    expect(inner.props('amount')).toBe(10)
  })

  it('Should pass compact true to FantasyNameGenerator', async () => {
    const component = await mountSuspended(FantasyNameGeneratorWidget)
    const inner = component.findComponent({ name: 'FantasyNameGenerator' })

    expect(inner.props('compact')).toBe(true)
  })
})
