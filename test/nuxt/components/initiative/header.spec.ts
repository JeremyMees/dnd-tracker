import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Header from '~/components/initiative/Header.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { dropdownStubs } from '~~/test/nuxt/stubs/dropdown-menu'
import { closeDialog, dialogIsOpen } from '~~/test/nuxt/stubs/dialog'

interface Props {
  data: InitiativeSheet | undefined
  encounterId?: number
}

const props: Props = {
  data: sheet,
}

const global = { stubs: dropdownStubs }

vi.mock('~/components/live/SessionPanel.vue', () => ({
  default: {
    name: 'SessionPanelStub',
    props: ['encounterId'],
    template: '<div test-id="session-panel-stub" />',
  },
}))

describe('Initiative header', () => {
  it('Should render correctly with required props', async () => {
    const component = await mountSuspended(Header, { props, global })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display pet when its active in the settings', async () => {
    const component = await mountSuspended(Header, { props, global })

    expect(component.find('[test-id="pet"]').exists()).toBeTruthy()
  })

  it('Should not display pet when its not active in the settings', async () => {
    const component = await mountSuspended(Header, {
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
    const component = await mountSuspended(Header, {
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
    const component = await mountSuspended(Header, {
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
    const component = await mountSuspended(Header, {
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
    const component = await mountSuspended(Header, {
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
    expect(
      component.find('[test-id="reset"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should emit next event when next button is clicked', async () => {
    const component = await mountSuspended(Header, { props, global })

    await component.find('[test-id="next"]').trigger('click')

    expect(component.emitted('next')).toBeTruthy()
  })

  it('Should emit previous event when previous button is clicked', async () => {
    const component = await mountSuspended(Header, {
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

  it('Should not display the live session trigger without an encounterId', async () => {
    const component = await mountSuspended(Header, { props, global })

    expect(
      component.find('[test-id="live-session-trigger"]').exists(),
    ).toBeFalsy()
  })

  it('Should display the live session trigger when an encounterId is given', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    expect(
      component.find('[test-id="live-session-trigger"]').exists(),
    ).toBeTruthy()
  })

  it('Should render the live session panel with the encounterId when opened', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    await component.find('[test-id="live-session-trigger"]').trigger('click')
    await nextTick()

    const panel = component.findComponent({ name: 'SessionPanelStub' })

    expect(panel.exists()).toBeTruthy()
    expect(panel.props('encounterId')).toBe(42)
  })

  it('Should close the live session dialog when it is dismissed', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    await component.find('[test-id="live-session-trigger"]').trigger('click')
    await nextTick()

    expect(dialogIsOpen(component)).toBe(true)

    await closeDialog(component)

    expect(dialogIsOpen(component)).toBe(false)
  })

  it('Should not display the history trigger without an encounterId', async () => {
    const component = await mountSuspended(Header, { props, global })

    expect(component.find('[test-id="history-trigger"]').exists()).toBeFalsy()
  })

  it('Should display the history trigger when an encounterId is given', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    expect(component.find('[test-id="history-trigger"]').exists()).toBeTruthy()
  })

  it('Should emit toggleHistory when the history trigger is clicked', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    await component.find('[test-id="history-trigger"]').trigger('click')

    expect(component.emitted('toggleHistory')).toBeTruthy()
  })

  it('Should label the history trigger with the open action when the log is closed', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    expect(component.find('[test-id="history-trigger"]').text()).toBe(
      'actions.openCombatLog',
    )
  })

  it('Should label the history trigger with the close action when the log is open', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42, historyOpen: true },
      global,
    })

    expect(component.find('[test-id="history-trigger"]').text()).toBe(
      'actions.closeCombatLog',
    )
  })

  it('Should not display the end encounter button without an encounterId', async () => {
    const component = await mountSuspended(Header, { props, global })

    expect(component.find('[test-id="end-encounter"]').exists()).toBeFalsy()
  })

  it('Should display the end encounter button when an encounterId is given', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    expect(component.find('[test-id="end-encounter"]').exists()).toBeTruthy()
  })

  it('Should emit endEncounter when the end encounter button is clicked', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
      global,
    })

    await component.find('[test-id="end-encounter"]').trigger('click')

    expect(component.emitted('endEncounter')).toHaveLength(1)
  })

  it('Should disable the end encounter button when the sheet has no rows', async () => {
    const component = await mountSuspended(Header, {
      props: {
        ...props,
        encounterId: 42,
        data: { ...props.data, rows: [] } as InitiativeSheet,
      },
      global,
    })

    expect(
      component.find('[test-id="end-encounter"]').attributes('disabled'),
    ).toBeDefined()
  })

  describe('Reset submenu', () => {
    it('Should emit a soft reset when the soft option is clicked', async () => {
      const component = await mountSuspended(Header, { props, global })

      await component.find('[test-id="reset-soft"]').trigger('click')

      expect(component.emitted('reset')?.[0]).toEqual([false])
    })

    it('Should emit a hard reset when the hard option is clicked', async () => {
      const component = await mountSuspended(Header, { props, global })

      await component.find('[test-id="reset-hard"]').trigger('click')

      expect(component.emitted('reset')?.[0]).toEqual([true])
    })
  })
})
