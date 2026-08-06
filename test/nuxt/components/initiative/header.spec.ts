import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Header from '~/components/initiative/Header.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'

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
})
