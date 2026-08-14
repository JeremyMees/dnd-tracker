import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import LiveRowCard from '~/components/live/RowCard.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

function setSeat(overrides: Partial<LiveJoinResponse> = {}): void {
  localStorage.setItem(
    'live-seat',
    JSON.stringify({
      sessionToken: 'session-token',
      seatToken: 'seat-token',
      seat: 'seat-1',
      row: 'row-1',
      spectator: false,
      code: 'ABC234',
      expiresAt: 'later',
      uuid: 'session-uuid',
      ...overrides,
    }),
  )
}

describe('LiveRowCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the name, type icon and initiative', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.get('[test-id="name"]').text()).toBe('Elara')
    expect(component.get('[test-id="initiative"]').text()).toContain('15')
  })

  it('highlights the card when active', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: true },
    })

    expect(component.get('[test-id="row"]').classes()).toContain(
      'border-primary!',
    )
  })

  it('does not highlight the card when inactive', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.get('[test-id="row"]').classes()).not.toContain(
      'border-primary!',
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

  it('marks the hit points as destructive when at or below zero', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, hitPoints: 0, maxHitPoints: 20 },
        active: false,
      },
    })

    expect(component.get('[test-id="hp"] span').classes()).toContain(
      'text-destructive',
    )
  })

  it('hides the max hit points when it equals the current hit points', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, hitPoints: 20, maxHitPoints: 20 },
        active: false,
      },
    })

    expect(component.get('[test-id="hp"]').text()).not.toContain('/')
  })

  it('hides the temp hit points indicator when there are none', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          hitPoints: 8,
          maxHitPoints: 20,
          tempHitPoints: 0,
        },
        active: false,
      },
    })

    expect(component.get('[test-id="hp"]').text()).not.toContain('+')
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
      'general.bloodied',
    )
    expect(component.get('[test-id="health-band"]').classes()).toContain(
      'border-warning',
    )
  })

  it('styles the health band badge as healthy', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, type: 'monster', healthBand: 'healthy' },
        active: false,
      },
    })

    expect(component.get('[test-id="health-band"]').classes()).toContain(
      'border-success',
    )
  })

  it('styles the health band badge as critical', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, type: 'monster', healthBand: 'critical' },
        active: false,
      },
    })

    expect(component.get('[test-id="health-band"]').classes()).toContain(
      'border-destructive',
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

  it('hides the temp armor class indicator when there is none', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: { ...baseRow, armorClass: 14, tempArmorClass: 0 },
        active: false,
      },
    })

    expect(component.get('[test-id="ac"]').text()).not.toContain('+')
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

  it('shows the condition level when defined', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          conditions: [
            { name: 'Exhaustion', id: 'exhaustion', desc: '', level: 2 },
          ],
        },
        active: false,
      },
    })

    expect(component.get('[test-id="conditions"]').text()).toContain('(2)')
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

  it('highlights the death saves grid as stabilized when all saves succeed', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          deathSaves: {
            save: [true, true, true],
            fail: [false, false, false],
          },
        },
        active: false,
      },
    })

    expect(component.get('[test-id="death-saves"]').classes()).toContain(
      'bg-success/20',
    )
  })

  it('highlights the death saves grid as dead when all saves fail', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: {
        row: {
          ...baseRow,
          deathSaves: {
            save: [false, false, false],
            fail: [true, true, true],
          },
        },
        active: false,
      },
    })

    expect(component.get('[test-id="death-saves"]').classes()).toContain(
      'bg-destructive/20',
    )
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

  it('does not show the own badge without a claimed seat', async () => {
    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.find('[test-id="own"]').exists()).toBe(false)
  })

  it('shows the own badge for the claimed row', async () => {
    setSeat({ row: baseRow.id })

    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.get('[test-id="own"]').text()).toBe('general.you')
  })

  it('does not show the own badge for a different row', async () => {
    setSeat({ row: 'row-2' })

    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.find('[test-id="own"]').exists()).toBe(false)
  })

  it('does not show the own badge for a spectator seat', async () => {
    setSeat({ row: baseRow.id, spectator: true })

    const component = await mountSuspended(LiveRowCard, {
      props: { row: baseRow, active: false },
    })

    expect(component.find('[test-id="own"]').exists()).toBe(false)
  })
})
