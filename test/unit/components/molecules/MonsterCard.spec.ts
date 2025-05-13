import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import MonsterCard from '~/components/molecules/MonsterCard.vue'
import open5eItem from '~~/test/unit/fixtures/open5e-item.json'

interface Props {
  monster: Open5eItem
  addable?: boolean
}

const props: Props = {
  monster: open5eItem as unknown as Open5eItem,
  addable: false,
}

describe('MonsterCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(MonsterCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(MonsterCard, { props })

    expect(component.find('[data-test-title]').text()).toBe(props.monster.name)
    expect(component.find('[data-test-add-button]').exists()).toBe(props.addable)
    expect(component.find('[data-test-actions-table]').exists()).toBeFalsy()
    expect(component.find('[data-test-expand-button]').exists()).toBeTruthy()
  })

  it('Should be able to expand the card', async () => {
    const component = await mountSuspended(MonsterCard, { props })
    const button = component.find('[data-test-expand-button]')

    expect(component.find('[data-test-actions-table]').exists()).toBeFalsy()

    await button.trigger('click')
    await nextTick()

    expect(component.find('[data-test-actions-table]').exists()).toBeTruthy()
  })

  it('Should be able to add the monster', async () => {
    const component = await mountSuspended(MonsterCard, { props: { ...props, addable: true } })
    const button = component.find('[data-test-add-button]')

    expect(button.exists()).toBeTruthy()

    await button.trigger('click')
    await nextTick()

    expect(component.emitted('add')).toBeTruthy()
    expect(component.emitted('add')![0]).toEqual([props.monster])
  })
})
