import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ChoiceCards from '~/components/molecules/ChoiceCards.vue'

const options: ChoiceCardOption<'scratch' | 'bestiary'>[] = [
  {
    value: 'scratch',
    label: 'From scratch',
    description: 'Start with an empty form',
    icon: 'tabler:file',
    iconClass: 'text-primary',
  },
  { value: 'bestiary', label: 'From the bestiary', icon: 'tabler:book' },
]

let wrapper: VueWrapper | undefined

async function mountChoiceCards(description?: string) {
  wrapper = await mountSuspended(ChoiceCards, {
    props: { title: 'Where do you start?', description, options },
  })

  return wrapper
}

describe('ChoiceCards', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should match snapshot', async () => {
    const component = await mountChoiceCards('Pick one')

    expect(component.html()).toMatchSnapshot()
  })

  it('Should label the group with the title', async () => {
    const component = await mountChoiceCards()

    const group = component.get('[role="group"]')
    const heading = component.get('h3')

    expect(heading.text()).toBe('Where do you start?')
    expect(group.attributes('aria-labelledby')).toBe(heading.attributes('id'))
  })

  it('Should show the description when given', async () => {
    const component = await mountChoiceCards('Pick one')

    expect(component.get('header').text()).toContain('Pick one')
  })

  it('Should leave out the description when not given', async () => {
    const component = await mountChoiceCards()

    expect(component.findAll('header p')).toHaveLength(0)
  })

  it('Should render a button per option', async () => {
    const component = await mountChoiceCards()

    const buttons = component.findAll('button')

    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.attributes('type')).toBe('button')
    expect(buttons[0]!.attributes('test-id')).toBe('choice-scratch')
    expect(buttons[1]!.attributes('test-id')).toBe('choice-bestiary')
  })

  it('Should show the label and description of an option', async () => {
    const component = await mountChoiceCards()

    const scratch = component.get('[test-id="choice-scratch"]')

    expect(scratch.text()).toContain('From scratch')
    expect(scratch.text()).toContain('Start with an empty form')
  })

  it('Should only show the label for an option without description', async () => {
    const component = await mountChoiceCards()

    const bestiary = component.get('[test-id="choice-bestiary"]')

    expect(bestiary.findAll('.text-muted-foreground.text-sm')).toHaveLength(0)
  })

  it('Should emit the value of the picked option', async () => {
    const component = await mountChoiceCards()

    await component.get('[test-id="choice-bestiary"]').trigger('click')

    expect(component.emitted('select')).toEqual([['bestiary']])
  })
})
