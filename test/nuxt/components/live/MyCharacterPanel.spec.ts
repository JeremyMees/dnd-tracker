import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveMyCharacterPanel from '~/components/live/MyCharacterPanel.vue'
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
  endTurn: true,
}

const otherRow: PlayerRow = { ...baseRow, id: 'row-2', name: 'Goblin 1' }

function isHidden(wrapper: {
  attributes: (key: string) => string | undefined
}): boolean {
  return (wrapper.attributes('style') ?? '').includes('display: none')
}

describe('LiveMyCharacterPanel', () => {
  it('expands the controls when the row is taking its turn', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: baseRow, allow },
      global: { stubs },
    })

    expect(component.get('[test-id="title"]').text()).toContain('Elara')
    expect(component.get('[test-id="title"]').text()).toContain(
      'pages.live.yourTurn',
    )
    expect(component.get('[test-id="controls-probe"]').text()).toBe(baseRow.id)
    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('shows who is taking its turn while waiting, collapsed and inert', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: otherRow, allow },
      global: { stubs },
    })

    expect(component.get('[test-id="title"]').text()).toContain('Goblin 1')
    expect(component.get('[test-id="title"]').text()).toContain(
      'general.waiting',
    )
    expect(isHidden(component.get('[test-id="controls"]'))).toBe(true)
    expect(component.get('[test-id="toggle"]').attributes('disabled')).toBe('')
  })

  it('collapses the controls when the toggle is clicked', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: baseRow, allow },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })

  it('re-expands the controls once the row becomes active again', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: otherRow, allow },
      global: { stubs },
    })

    await component.setProps({ activeRow: baseRow })

    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('collapses the controls once the row is no longer active', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: baseRow, allow },
      global: { stubs },
    })

    await component.setProps({ activeRow: otherRow })

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })

  it('does not toggle while waiting for the turn', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, activeRow: otherRow, allow },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')

    expect(isHidden(component.get('[test-id="controls"]'))).toBe(true)
  })
})
