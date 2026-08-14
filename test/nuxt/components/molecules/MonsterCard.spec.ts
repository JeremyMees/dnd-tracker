import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import MonsterCard from '~/components/molecules/MonsterCard.vue'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'

interface Props {
  monster: DndMonster
  addable?: boolean
}

const props: Props = {
  monster: dndMonsterFixture,
  addable: false,
}

describe('MonsterCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(MonsterCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(MonsterCard, { props })

    expect(component.find('[test-id="title"]').text()).toBe(props.monster.name)
    expect(component.find('[test-id="add-button"]').exists()).toBe(
      props.addable,
    )
    expect(component.find('[test-id="actions-table"]').exists()).toBeFalsy()
    expect(component.find('[test-id="expand-button"]').exists()).toBeTruthy()
  })

  it('Should be able to expand the card', async () => {
    const component = await mountSuspended(MonsterCard, { props })
    const button = component.find('[test-id="expand-button"]')

    expect(component.find('[test-id="actions-table"]').exists()).toBeFalsy()

    await button.trigger('click')
    await nextTick()

    expect(component.find('[test-id="actions-table"]').exists()).toBeTruthy()
  })

  it('Should be able to add the monster', async () => {
    const component = await mountSuspended(MonsterCard, {
      props: { ...props, addable: true },
    })
    const button = component.find('[test-id="add-button"]')

    expect(button.exists()).toBeTruthy()

    await button.trigger('click')
    await nextTick()

    expect(component.emitted('add')).toBeTruthy()
    expect(component.emitted('add')![0]).toEqual([props.monster])
  })

  it('Should fall back to a dash when core stats are missing', async () => {
    const monster = {
      ...dndMonsterFixture,
      challengeRating: undefined,
      armorClass: undefined,
      hitPoints: undefined,
      type: undefined,
    } as unknown as DndMonster

    const component = await mountSuspended(MonsterCard, {
      props: { ...props, monster },
    })

    expect(component.text()).toContain('Type: _')
    expect(component.text()).not.toContain(String(dndMonsterFixture.hitPoints))
  })

  it('Should hide bonus badges when their values are missing', async () => {
    const monster = {
      ...dndMonsterFixture,
      initiativeBonus: undefined,
      passivePerception: undefined,
    } as unknown as DndMonster

    const component = await mountSuspended(MonsterCard, {
      props: { ...props, monster },
    })

    expect(component.text()).not.toContain('general.initiativeBonus')
    expect(component.text()).not.toContain('general.passivePerception')
  })

  it('Should show the proficiency bonus badge when present', async () => {
    const monster = { ...dndMonsterFixture, proficiencyBonus: 4 }

    const component = await mountSuspended(MonsterCard, {
      props: { ...props, monster },
    })

    expect(component.text()).toContain('general.proficiencyBonus')
    expect(component.text()).toContain('+4')
  })
})
