import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveStatAc from '~/components/live/StatAc.vue'
import LiveStatConcentration from '~/components/live/StatConcentration.vue'
import LiveStatHealthBand from '~/components/live/StatHealthBand.vue'
import LiveStatHp from '~/components/live/StatHp.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

describe('LiveStatHp', () => {
  it('shows the current, max and temporary hit points', async () => {
    const component = await mountSuspended(LiveStatHp, {
      props: {
        row: { ...baseRow, hitPoints: 8, maxHitPoints: 20, tempHitPoints: 3 },
      },
    })

    const text = component.get('[test-id="hp"]').text()

    expect(text).toContain('8')
    expect(text).toContain('/ 20')
    expect(text).toContain('+3')
  })

  it('hides the max hit points when they equal the current hit points', async () => {
    const component = await mountSuspended(LiveStatHp, {
      props: { row: { ...baseRow, hitPoints: 20, maxHitPoints: 20 } },
    })

    expect(component.get('[test-id="hp"]').text()).not.toContain('/')
  })

  it('marks the hit points as destructive at or below zero', async () => {
    const component = await mountSuspended(LiveStatHp, {
      props: { row: { ...baseRow, hitPoints: 0, maxHitPoints: 20 } },
    })

    expect(component.get('[test-id="hp"]').html()).toContain('text-destructive')
  })

  it('renders the fallback slot when the hit points are hidden', async () => {
    const component = await mountSuspended(LiveStatHp, {
      props: { row: baseRow },
      slots: { default: () => h('span', { 'test-id': 'fallback' }, 'hidden') },
    })

    expect(component.find('[test-id="hp"]').exists()).toBe(false)
    expect(component.get('[test-id="fallback"]').text()).toBe('hidden')
  })
})

describe('LiveStatAc', () => {
  it('shows the armor class and its temporary bonus', async () => {
    const component = await mountSuspended(LiveStatAc, {
      props: { row: { ...baseRow, armorClass: 14, tempArmorClass: 2 } },
    })

    const text = component.get('[test-id="ac"]').text()

    expect(text).toContain('14')
    expect(text).toContain('+2')
  })

  it('renders the fallback slot when the armor class is hidden', async () => {
    const component = await mountSuspended(LiveStatAc, {
      props: { row: baseRow },
      slots: { default: () => h('span', { 'test-id': 'fallback' }, 'hidden') },
    })

    expect(component.find('[test-id="ac"]').exists()).toBe(false)
    expect(component.get('[test-id="fallback"]').text()).toBe('hidden')
  })
})

describe('LiveStatHealthBand', () => {
  it.each([
    ['healthy', 'text-success'],
    ['bloodied', 'text-warning'],
    ['critical', 'text-destructive'],
  ])('styles the %s band', async (band, expected) => {
    const component = await mountSuspended(LiveStatHealthBand, {
      props: { band: band as DndHealthBand },
    })

    const badge = component.get('[test-id="health-band"]')

    expect(badge.text()).toBe(`general.${band}`)
    expect(badge.classes()).toContain(expected)
  })
})

describe('LiveStatConcentration', () => {
  it('shows the filled icon and no label by default', async () => {
    const component = await mountSuspended(LiveStatConcentration, {
      props: { active: true },
    })

    expect(component.html()).toContain('circle-filled')
    expect(component.text()).toBe('')
  })

  it('shows the dotted icon and the label when asked for', async () => {
    const component = await mountSuspended(LiveStatConcentration, {
      props: { active: false, label: true },
    })

    expect(component.html()).toContain('circle-dotted')
    expect(component.text()).toBe('general.concentration')
  })
})
