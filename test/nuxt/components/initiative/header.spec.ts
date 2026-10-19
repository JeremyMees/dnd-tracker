import { describe, expect, it, vi } from 'vitest'
import Header from '~/components/initiative/Header.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { useRegisteredCommands } from '~/composables/useCommands'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { closeDialog, dialogIsOpen } from '~~/test/nuxt/stubs/dialog'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

interface Props {
  data: InitiativeSheet | undefined
  encounterId?: number
}

const props: Props = {
  data: sheet,
}

const global = {}

vi.mock('~/components/live/SessionPanel.vue', () => ({
  default: {
    name: 'SessionPanelStub',
    props: ['encounterId'],
    template: '<div test-id="session-panel-stub" />',
  },
}))

describe('Initiative header', () => {
  it('Should render correctly with required props', async () => {
    const component = await mountWithTooltips(Header, { props, global })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display pet when its active in the settings', async () => {
    const component = await mountWithTooltips(Header, { props, global })

    expect(component.find('[test-id="pet"]').exists()).toBeTruthy()
  })

  it('Should not display pet when its not active in the settings', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          settings: {
            ...sheet.settings,
            pet: undefined,
          },
        },
      },
      global,
    })

    expect(component.find('[test-id="pet"]').exists()).toBeFalsy()
  })

  it('Should display correct round number', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          round: 5,
        },
      },
      global,
    })

    expect(component.find('[test-id="round"]').text()).toBe('5')
  })

  it('Should display default round number when not provided', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          round: 0,
        },
      },
      global,
    })

    expect(component.find('[test-id="round"]').text()).toBe('1')
  })

  it('Should disable previous button when round is 1 and activeIndex is 0', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          round: 1,
          activeIndex: 0,
        },
      },
      global,
    })

    expect(
      component.find('[test-id="previous"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should disable action buttons when there are no rows', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          rows: [],
        },
      },
      global,
    })

    expect(
      component.find('[test-id="next"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.find('[test-id="previous"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should emit next event when next button is clicked', async () => {
    const component = await mountWithTooltips(Header, { props, global })

    await component.find('[test-id="next"]').trigger('click')

    expect(component.emitted('next')).toBeTruthy()
  })

  it('Should emit previous event when previous button is clicked', async () => {
    const component = await mountWithTooltips(Header, {
      props: {
        data: {
          ...sheet,
          activeIndex: 2,
        },
      },
      global,
    })

    await component.find('[test-id="previous"]').trigger('click')

    expect(component.emitted('previous')).toBeDefined()
  })

  it('Should open the command palette from the actions button', async () => {
    const { open } = useCommandPalette()
    const component = await mountWithTooltips(Header, { props, global })

    open.value = false

    await component.find('[test-id="command-palette-trigger"]').trigger('click')

    expect(open.value).toBe(true)

    open.value = false
  })

  describe('Live session command', () => {
    const commands = useRegisteredCommands()

    function liveSessionCommand() {
      return commands.value.find(command => command.id === 'live-session')
    }

    it('Should not offer the live session without an encounterId', async () => {
      await mountWithTooltips(Header, { props, global })

      expect(liveSessionCommand()).toBeUndefined()
    })

    it('Should open the live session panel with the encounterId', async () => {
      const component = await mountWithTooltips(Header, {
        props: { ...props, encounterId: 42 },
        global,
      })

      liveSessionCommand()?.run()
      await nextTick()

      const panel = component.findComponent({ name: 'SessionPanelStub' })

      expect(panel.exists()).toBeTruthy()
      expect(panel.props('encounterId')).toBe(42)
    })

    it('Should close the live session dialog when it is dismissed', async () => {
      const component = await mountWithTooltips(Header, {
        props: { ...props, encounterId: 42 },
        global,
      })

      liveSessionCommand()?.run()
      await nextTick()

      expect(dialogIsOpen(component)).toBe(true)

      await closeDialog(component)

      expect(dialogIsOpen(component)).toBe(false)
    })
  })
})
