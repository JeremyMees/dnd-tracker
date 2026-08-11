import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LiveMyCharacterPanel from '~/components/live/MyCharacterPanel.vue'
import { playerRow as baseRow } from '~~/test/fixtures/player-portal'

const ControlsProbe = defineComponent({
  props: ['row'],
  template: '<div test-id="controls-probe">{{ row.id }}</div>',
})

const stubs = { LiveMyCharacterControls: ControlsProbe }

const allow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
}

function isHidden(wrapper: {
  attributes: (key: string) => string | undefined
}): boolean {
  return (wrapper.attributes('style') ?? '').includes('display: none')
}

describe('LiveMyCharacterPanel', () => {
  it('shows the character name and controls, expanded by default', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, active: false, allow },
      global: { stubs },
    })

    expect(component.get('[test-id="name"]').text()).toBe('Elara')
    expect(component.get('[test-id="controls-probe"]').text()).toBe(baseRow.id)
    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('collapses the controls when the toggle is clicked', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, active: false, allow },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })

  it('re-expands the controls once the row becomes active again', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, active: false, allow },
      global: { stubs },
    })

    await component.get('[test-id="toggle"]').trigger('click')
    await component.setProps({ active: true })

    expect(isHidden(component.get('[test-id="controls"]'))).toBe(false)
  })

  it('collapses the controls once the row is no longer active', async () => {
    const component = await mountSuspended(LiveMyCharacterPanel, {
      props: { row: baseRow, active: true, allow },
      global: { stubs },
    })

    await component.setProps({ active: false })

    expect(component.get('[test-id="toggle"]').attributes('aria-label')).toBe(
      'actions.expand',
    )
  })
})
