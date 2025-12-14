import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Header from '~/components/initiative/Header'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'

interface Props {
  data: InitiativeSheet | undefined
}

const props: Props = {
  data: sheet,
}

describe('Initiative header', () => {
  it('Should render correctly with required props', async () => {
    const component = await mountSuspended(Header, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display pet when its active in the settings', async () => {
    const component = await mountSuspended(Header, { props })

    expect(component.find('[data-test-pet]').exists()).toBeTruthy()
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

    expect(component.find('[data-test-pet]').exists()).toBeFalsy()
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

    expect(component.find('[data-test-round]').text()).toBe('5')
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

    expect(component.find('[data-test-round]').text()).toBe('1')
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

    expect(component.find('[data-test-previous]').attributes('disabled')).toBeDefined()
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

    expect(component.find('[data-test-next]').attributes('disabled')).toBeDefined()
    expect(component.find('[data-test-previous]').attributes('disabled')).toBeDefined()
    expect(component.find('[data-test-reset]').attributes('disabled')).toBeDefined()
  })

  it('Should emit next event when next button is clicked', async () => {
    const component = await mountSuspended(Header, { props })

    await component.find('[data-test-next]').trigger('click')

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

    await component.find('[data-test-previous]').trigger('click')

    expect(component.emitted('previous')).toBeDefined()
  })
})
