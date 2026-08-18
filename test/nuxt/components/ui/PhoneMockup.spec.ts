import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { PhoneMockup } from '~/components/ui/phone-mockup'

describe('PhoneMockup', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render at the default size when no size is given', async () => {
    wrapper = await mountSuspended(PhoneMockup)

    const svg = wrapper.get('svg')

    expect(svg.attributes('width')).toBe('433')
    expect(svg.attributes('height')).toBe('882')
    expect(svg.attributes('viewBox')).toBe('0 0 433 882')
  })

  it('Should follow the given width and height in its viewbox', async () => {
    wrapper = await mountSuspended(PhoneMockup, {
      props: { width: 200, height: 400 },
    })

    const svg = wrapper.get('svg')

    expect(svg.attributes('width')).toBe('200')
    expect(svg.attributes('height')).toBe('400')
    expect(svg.attributes('viewBox')).toBe('0 0 200 400')
  })

  it('Should leave the screen empty when no source is given', async () => {
    wrapper = await mountSuspended(PhoneMockup)

    expect(wrapper.find('image').exists()).toBe(false)
  })

  it('Should render the source on the screen when one is given', async () => {
    wrapper = await mountSuspended(PhoneMockup, {
      props: { src: '/player-portal.png' },
    })

    const image = wrapper.get('image')

    expect(image.attributes('href')).toBe('/player-portal.png')
    expect(image.attributes('preserveAspectRatio')).toBe('xMidYMid slice')
  })

  it('Should clip the screen to the rounded corners of the frame', async () => {
    wrapper = await mountSuspended(PhoneMockup, {
      props: { src: '/player-portal.png' },
    })

    expect(wrapper.get('image').attributes('style')).toContain(
      'url(#phone-mockup-screen)',
    )
    expect(wrapper.find('clipPath#phone-mockup-screen').exists()).toBe(true)
  })
})
