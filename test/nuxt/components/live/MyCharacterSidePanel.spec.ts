import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveMyCharacterSidePanel from '~/components/live/MyCharacterSidePanel.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

const ControlsProbe = defineComponent({
  props: ['row', 'rows', 'active'],
  template:
    '<div test-id="controls-probe" :data-active="active" :data-rows="rows.map(r => r.id).join()">{{ row.id }}</div>',
})

const stubs = { LiveMyCharacterControls: ControlsProbe }

const allow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
  reaction: true,
  ready: true,
  endTurn: true,
}

const ownRow: PlayerRow = {
  ...baseRow,
  hitPoints: 9,
  maxHitPoints: 20,
  armorClass: 15,
}

const otherRow: PlayerRow = { ...baseRow, id: 'row-2', name: 'Goblin 1' }

const rows = [ownRow, otherRow]

describe('LiveMyCharacterSidePanel', () => {
  it('shows the controls when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, rows, activeRow: ownRow, allow, settings: {} },
      global: { stubs },
    })

    expect(component.get('[test-id="heading"]').text()).toBe('Elara')
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-active'),
    ).toBe('true')
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-rows'),
    ).toBe(rows.map(row => row.id).join())
    expect(component.get('[test-id="turn"]').text()).toBe('pages.live.yourTurn')
  })

  it('highlights the panel when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, rows, activeRow: ownRow, allow, settings: {} },
      global: { stubs },
    })

    const panel = component.get('[test-id="my-character-side-panel"]')

    expect(panel.attributes('data-active')).toBe('true')
    expect(panel.classes()).toContain('border-primary')
  })

  it('keeps your own character and controls while another row acts', async () => {
    const component = await mountSuspended(LiveMyCharacterSidePanel, {
      props: { row: ownRow, rows, activeRow: otherRow, allow, settings: {} },
      global: { stubs },
    })

    const panel = component.get('[test-id="my-character-side-panel"]')

    expect(panel.attributes('data-active')).toBe('false')
    expect(panel.classes()).not.toContain('border-primary')
    expect(component.get('[test-id="heading"]').text()).toBe('Elara')
    expect(component.get('[test-id="turn"]').text()).toContain(
      'pages.live.currentTurn: Goblin 1',
    )
    expect(component.get('[test-id="controls-probe"]').text()).toBe(ownRow.id)
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-active'),
    ).toBe('false')

    component.unmount()
  })
})
