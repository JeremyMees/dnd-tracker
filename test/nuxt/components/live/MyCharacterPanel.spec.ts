import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveMyCharacterPanel from '~/components/live/MyCharacterPanel.vue'
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

const otherRow: PlayerRow = { ...baseRow, id: 'row-2', name: 'Goblin 1' }

const rows = [baseRow, otherRow]

function isHidden(wrapper: {
  attributes: (key: string) => string | undefined
}): boolean {
  return (wrapper.attributes('style') ?? '').includes('display: none')
}

describe('LiveMyCharacterPanel', () => {
  it('expands the controls when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: baseRow, allow, settings: {} },
      global: { stubs },
    })

    expect(component.get('[test-id="title"]').text()).toContain('Elara')
    expect(component.get('[test-id="title"]').text()).toContain(
      'pages.live.yourTurn',
    )
    expect(component.get('[test-id="controls-probe"]').text()).toBe(baseRow.id)
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-rows'),
    ).toBe(rows.map(row => row.id).join())
    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('shows your own character and who is up while waiting, collapsed', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: otherRow, allow, settings: {} },
      global: { stubs },
    })

    const title = component.get('[test-id="title"]').text()

    expect(title).toContain('Elara')
    expect(title).toContain('general.waiting: Goblin 1')
    expect(isHidden(component.get('[test-id="controls"]'))).toBe(true)
    expect(
      component.get('[test-id="toggle"]').attributes('disabled'),
    ).toBeUndefined()

    component.unmount()
  })

  it('collapses the controls when the toggle is clicked', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: baseRow, allow, settings: {} },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })

  it('re-expands the controls once the row becomes active again', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: otherRow, allow, settings: {} },
      global: { stubs },
    })

    await component.setProps({ activeRow: baseRow })

    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('collapses the controls once the row is no longer active', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: baseRow, allow, settings: {} },
      global: { stubs },
    })

    await component.setProps({ activeRow: otherRow })

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })

  it('opens the controls while waiting so a readied action can be used', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, rows, activeRow: otherRow, allow, settings: {} },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')

    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
    expect(
      component.get('[test-id="controls-probe"]').attributes('data-active'),
    ).toBe('false')

    component.unmount()
  })
})
