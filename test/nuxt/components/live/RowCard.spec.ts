import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveRowCard from '~/components/live/RowCard.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

describe('LiveRowCard', () => {
  it('renders the name, type icon and initiative', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.get('[test-id="name"]').text()).toBe('Elara')
    expect(component.get('[test-id="initiative"]').text()).toContain('15')
    expect(component.find('[test-id="active"]').exists()).toBe(false)
  })

  it('shows the current turn label when active', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: true },
    })

    expect(component.get('[test-id="active"]').text()).toBe(
      'pages.live.currentTurn',
    )
  })

  it('shows hit points and temp hit points when defined', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, hitPoints: 8, maxHitPoints: 20, tempHitPoints: 3 },
        active: false,
      },
    })

    const hp = component.get('[test-id="hp"]')

    expect(hp.text()).toContain('8')
    expect(hp.text()).toContain('/ 20')
    expect(hp.text()).toContain('+3')
    expect(component.find('[test-id="health-band"]').exists()).toBe(false)
  })

  it('shows the health band badge instead of numbers when hit points are hidden', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, type: 'monster', healthBand: 'bloodied' },
        active: false,
      },
    })

    expect(component.find('[test-id="hp"]').exists()).toBe(false)
    expect(component.get('[test-id="health-band"]').text()).toBe(
      'pages.live.health.bloodied',
    )
  })

  it('shows armor class and temp armor class when defined', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, armorClass: 14, tempArmorClass: 2 },
        active: false,
      },
    })

    const ac = component.get('[test-id="ac"]')

    expect(ac.text()).toContain('14')
    expect(ac.text()).toContain('+2')
  })

  it('shows conditions as badges', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          conditions: [{ name: 'Poisoned', id: 'poisoned', desc: '' }],
        },
        active: false,
      },
    })

    expect(component.get('[test-id="conditions"]').text()).toContain('Poisoned')
  })

  it('shows the concentration indicator as active when concentrating', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: { ...baseRow, concentration: true }, active: false },
    })

    expect(
      component.get('[test-id="concentration"]').attributes('data-active'),
    ).toBe('true')
  })

  it('shows the concentration indicator as inactive when not concentrating', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(
      component.get('[test-id="concentration"]').attributes('data-active'),
    ).toBeUndefined()
  })

  it('hides the concentration indicator for lair rows', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: { ...baseRow, type: 'lair' }, active: false },
    })

    expect(component.find('[test-id="concentration"]').exists()).toBe(false)
  })

  it('shows the death saves grid when present', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          deathSaves: {
            save: [true, false, false],
            fail: [true, true, false],
          },
        },
        active: false,
      },
    })

    const grid = component.get('[test-id="death-saves"]')

    expect(grid.findAll('[test-id="save"]')).toHaveLength(3)
    expect(grid.findAll('[test-id="fail"]')).toHaveLength(3)
  })

  it('hides the death saves grid for monster rows even when present', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          type: 'monster',
          deathSaves: {
            save: [false, false, false],
            fail: [false, false, false],
          },
        },
        active: false,
      },
    })

    expect(component.find('[test-id="death-saves"]').exists()).toBe(false)
  })

  it('does not show the death saves grid when absent', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.find('[test-id="death-saves"]').exists()).toBe(false)
  })
})
