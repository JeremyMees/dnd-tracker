import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Header from '~/components/initiative/Header.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { openPopover } from '~~/test/nuxt/stubs/popover'

interface HeaderVM {
  resetOpen: boolean
}

interface Props {
  data: InitiativeSheet | undefined
  encounterId?: number
}

const props: Props = {
  data: sheet,
}

vi.mock('~/components/live/SessionPanel.vue', () => ({
  default: {
    name: 'SessionPanelStub',
    props: ['encounterId'],
    template: '<div test-id="session-panel-stub" />',
  },
}))

describe('Initiative header', () => {
  it('Should render correctly with required props', async () => {
    const component = await mountSuspended(Header, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display pet when its active in the settings', async () => {
    const component = await mountSuspended(Header, { props })

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
    const component = await mountSuspended(Header, { props })

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
    })

    await component.find('[test-id="previous"]').trigger('click')

    expect(component.emitted('previous')).toBeDefined()
  })

  it('Should not display the live session trigger without an encounterId', async () => {
    const component = await mountSuspended(Header, { props })

    expect(
      component.find('[test-id="live-session-trigger"]').exists(),
    ).toBeFalsy()
  })

  it('Should display the live session trigger when an encounterId is given', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
    })

    expect(
      component.find('[test-id="live-session-trigger"]').exists(),
    ).toBeTruthy()
  })

  it('Should render the live session panel with the encounterId when opened', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
    })

    await component.find('[test-id="live-session-trigger"]').trigger('click')
    await nextTick()

    const panel = component.findComponent({ name: 'SessionPanelStub' })

    expect(panel.exists()).toBeTruthy()
    expect(panel.props('encounterId')).toBe(42)
  })

  it('Should not display the history trigger without an encounterId', async () => {
    const component = await mountSuspended(Header, { props })

    expect(component.find('[test-id="history-trigger"]').exists()).toBeFalsy()
  })

  it('Should display the history trigger when an encounterId is given', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
    })

    expect(component.find('[test-id="history-trigger"]').exists()).toBeTruthy()
  })

  it('Should emit toggleHistory when the history trigger is clicked', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42 },
    })

    await component.find('[test-id="history-trigger"]').trigger('click')

    expect(component.emitted('toggleHistory')).toBeTruthy()
  })

  it('Should reflect the historyOpen prop on the history trigger', async () => {
    const component = await mountSuspended(Header, {
      props: { ...props, encounterId: 42, historyOpen: true },
    })

    expect(
      component.find('[test-id="history-trigger"]').attributes('aria-pressed'),
    ).toBe('true')
  })

  describe('Reset popover', () => {
    it('Should emit a soft reset and close the popover when the soft option is clicked', async () => {
      const component = await mountSuspended(Header, { props })
      const vm = component.vm as unknown as HeaderVM

      await openPopover(component)
      ;(
        document.body.querySelector(
          '[test-id="reset-soft"]',
        ) as HTMLButtonElement
      ).click()
      await nextTick()

      expect(component.emitted('reset')?.[0]).toEqual([false])
      expect(vm.resetOpen).toBe(false)
    })

    it('Should emit a hard reset and close the popover when the hard option is clicked', async () => {
      const component = await mountSuspended(Header, { props })
      const vm = component.vm as unknown as HeaderVM

      await openPopover(component)
      ;(
        document.body.querySelector(
          '[test-id="reset-hard"]',
        ) as HTMLButtonElement
      ).click()
      await nextTick()

      expect(component.emitted('reset')?.[0]).toEqual([true])
      expect(vm.resetOpen).toBe(false)
    })
  })
})
