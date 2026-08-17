import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveMyCharacterSidePanel from '~/components/live/MyCharacterSidePanel.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

const ControlsProbe = defineComponent({
  props: ['row', 'active'],
  template:
    '<div test-id="controls-probe" :data-active="active">{{ row.id }}</div>',
})

const stubs = { LiveMyCharacterControls: ControlsProbe }

const allow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
}

const ownRow: PlayerRow = {
  ...baseRow,
  hitPoints: 9,
  maxHitPoints: 20,
  armorClass: 15,
}

const otherRow: PlayerRow = { ...baseRow, id: 'row-2', name: 'Goblin 1' }

describe('LiveMyCharacterSidePanel', () => {
  it('shows the controls when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, activeRow: ownRow, allow },
      global: { stubs },
    })

    expect(component.get('[test-id="heading"]').text()).toBe('Elara')
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-active'),
    ).toBe('true')
    expect(component.find('[test-id="waiting"]').exists()).toBe(false)
  })

  it('highlights the panel when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, activeRow: ownRow, allow },
      global: { stubs },
    })

    const panel = component.get('[test-id="my-character-side-panel"]')

    expect(panel.attributes('data-active')).toBe('true')
    expect(panel.classes()).toContain('border-primary')
  })

  it('shows the waiting state with your own status while another row acts', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, activeRow: otherRow, allow },
      global: { stubs },
    })

    const panel = component.get('[test-id="my-character-side-panel"]')

    expect(panel.attributes('data-active')).toBe('false')
    expect(panel.classes()).not.toContain('border-primary')
    expect(component.get('[test-id="heading"]').text()).toBe('Goblin 1')
    expect(component.get('[test-id="waiting"]').text()).toContain(
      'pages.live.waitingText',
    )
    expect(component.get('[test-id="hp"]').text()).toContain('9')
    expect(component.get('[test-id="ac"]').text()).toBe('15')
    expect(component.find('[test-id="controls-probe"]').exists()).toBe(false)
  })

  it('falls back to the health band when the hit points are hidden', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: {
        row: { ...baseRow, healthBand: 'critical' },
        activeRow: otherRow,
        allow,
      },
      global: { stubs },
    })

    expect(component.get('[test-id="health-band"]').text()).toBe(
      'general.critical',
    )
  })
})
