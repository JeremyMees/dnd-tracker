import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import TitleText from '~/components/atoms/TitleText'

const props = {
  buttonLabel: 'Click Me',
  buttonLink: '/test',
}

const slots = {
  default: () => 'Test Title',
  text: () => 'This is a description text.',
}

describe('TitleText', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(TitleText, {
      props,
      slots,
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct default props', async () => {
    const component = await mountSuspended(TitleText)

    expect(component.props('center')).toBe(false)
    expect(component.props('buttonLabel')).toBe('')
    expect(component.props('buttonLink')).toBe('')
  })

  it('Should render title and text from slots', async () => {
    const component = await mountSuspended(TitleText, {
      props,
      slots,
    })

    expect(component.find('h2').text()).toBe('Test Title')
    expect(component.text()).toContain('This is a description text.')
  })

  it('Should not render h2 when default slot is empty', async () => {
    const component = await mountSuspended(TitleText)

    expect(component.find('h2').exists()).toBeFalsy()
  })

  it('Should apply center classes when center prop is true', async () => {
    const component = await mountSuspended(TitleText, {
      props: {
        ...props,
        center: true,
      },
      slots,
    })

    const buttonWrapper = component.find('[data-test-button]')

    expect(buttonWrapper.classes()).toContain('justify-center')
    expect(component.find('.group').classes()).toContain('text-center')
    expect(component.find('h2').classes()).toContain('mx-auto')
  })

  it('Should not apply center classes when center prop is false', async () => {
    const component = await mountSuspended(TitleText, {
      props: {
        ...props,
        center: false,
      },
      slots,
    })

    const buttonWrapper = component.find('[data-test-button]')

    expect(buttonWrapper.classes()).toContain('justify-start')
    expect(component.find('.group').classes()).not.toContain('text-center')
  })

  it('Should render button with link when buttonLabel and buttonLink are provided', async () => {
    const component = await mountSuspended(TitleText, {
      props,
      slots,
    })

    const link = component.find('[data-test-link]')

    expect(component.text()).toContain('Click Me')
    expect(link.exists()).toBeTruthy()
    expect(link.attributes('href')).toBe('/test')
  })

  it('Should not render button when buttonLabel is empty', async () => {
    const component = await mountSuspended(TitleText, {
      props: {
        buttonLink: '/test',
      },
      slots,
    })

    const button = component.find('[data-test-button]')

    expect(button.exists()).toBeFalsy()
  })

  it('Should not render button when buttonLink is empty', async () => {
    const component = await mountSuspended(TitleText, {
      props: {
        buttonLabel: 'Click Me',
      },
      slots,
    })

    const button = component.find('[data-test-button]')
    expect(button.exists()).toBeFalsy()
  })
})
