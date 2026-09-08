import { afterEach, describe, expect, it, vi } from 'vitest'
import MonsterCard from '~/components/molecules/MonsterCard.vue'
import {
  dismissTooltip,
  hoverTooltip,
  mountWithTooltips,
} from '~~/test/nuxt/stubs/tooltip'
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
  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    const component = await mountWithTooltips(MonsterCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountWithTooltips(MonsterCard, { props })

    expect(component.find('[test-id="title"]').text()).toBe(props.monster.name)
    expect(component.find('[test-id="add-button"]').exists()).toBe(
      props.addable,
    )
    expect(component.find('[test-id="actions-table"]').exists()).toBeFalsy()
    expect(component.find('[test-id="expand-button"]').exists()).toBeTruthy()
  })

  it('Should be able to expand the card', async () => {
    const component = await mountWithTooltips(MonsterCard, { props })
    const button = component.find('[test-id="expand-button"]')

    expect(component.find('[test-id="actions-table"]').exists()).toBeFalsy()

    await button.trigger('click')
    await nextTick()

    expect(component.find('[test-id="actions-table"]').exists()).toBeTruthy()
  })

  it('Should be able to add the monster', async () => {
    const component = await mountWithTooltips(MonsterCard, {
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

    const component = await mountWithTooltips(MonsterCard, {
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

    const component = await mountWithTooltips(MonsterCard, {
      props: { ...props, monster },
    })

    expect(component.text()).not.toContain('general.initiativeBonus')
    expect(component.text()).not.toContain('general.passivePerception')
  })

  it('Should show the proficiency bonus badge when present', async () => {
    const monster = { ...dndMonsterFixture, proficiencyBonus: 4 }

    const component = await mountWithTooltips(MonsterCard, {
      props: { ...props, monster },
    })

    expect(component.text()).toContain('general.proficiencyBonus')
    expect(component.text()).toContain('+4')
  })

  it('Should show the stat tooltips on hover', async () => {
    vi.useFakeTimers()

    const component = await mountWithTooltips(MonsterCard, { props })
    const trigger = component.find('[data-grace-area-trigger]')

    expect(trigger.attributes('data-state')).toBe('closed')

    await hoverTooltip(trigger)
    await vi.advanceTimersByTimeAsync(400)
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('delayed-open')
    expect(document.body.textContent).toContain('CR')
  })

  it('Should not open a tooltip before the delay has passed', async () => {
    vi.useFakeTimers()

    const component = await mountWithTooltips(MonsterCard, { props })
    const trigger = component.find('[data-grace-area-trigger]')

    await hoverTooltip(trigger)
    await vi.advanceTimersByTimeAsync(200)
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('Should open a neighbouring tooltip instantly within the skip delay', async () => {
    vi.useFakeTimers()

    const component = await mountWithTooltips(MonsterCard, { props })
    const [challengeRating, armorClass] = component.findAll(
      '[data-grace-area-trigger]',
    )

    await hoverTooltip(challengeRating!)
    await vi.advanceTimersByTimeAsync(400)
    expect(challengeRating!.attributes('data-state')).toBe('delayed-open')

    await dismissTooltip(challengeRating!)
    await hoverTooltip(armorClass!)
    await nextTick()

    expect(armorClass!.attributes('data-state')).toBe('instant-open')
  })

  it('Should delay a neighbouring tooltip once the skip delay has expired', async () => {
    vi.useFakeTimers()

    const component = await mountWithTooltips(MonsterCard, { props })
    const [challengeRating, armorClass] = component.findAll(
      '[data-grace-area-trigger]',
    )

    await hoverTooltip(challengeRating!)
    await vi.advanceTimersByTimeAsync(400)
    await dismissTooltip(challengeRating!)
    await vi.advanceTimersByTimeAsync(300)

    await hoverTooltip(armorClass!)
    await nextTick()

    expect(armorClass!.attributes('data-state')).toBe('closed')
  })
})
