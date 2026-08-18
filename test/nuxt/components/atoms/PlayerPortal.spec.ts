import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import PlayerPortal from '~/components/atoms/PlayerPortal.vue'

describe('PlayerPortal', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render the title and the intro text', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    expect(wrapper.text()).toContain('pages.home.playerPortal.title')
    expect(wrapper.text()).toContain('pages.home.playerPortal.text')
  })

  it('Should render every selling point with its title and text', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const items = wrapper.findAll('[test-id="portal-item"]')

    expect(items).toHaveLength(3)

    items.forEach((item, index) => {
      expect(item.text()).toContain(
        `pages.home.playerPortal.item${index + 1}.title`,
      )
      expect(item.text()).toContain(
        `pages.home.playerPortal.item${index + 1}.text`,
      )
    })
  })

  it('Should give every selling point an icon that is hidden for screen readers', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const icons = wrapper.findAll('[test-id="portal-item"] .iconify')

    expect(icons).toHaveLength(3)
    icons.forEach(icon => {
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  it('Should link the call to action to the live page', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const link = wrapper.get('[test-id="portal-link"]')

    expect(link.attributes('href')).toBe('/live')
    expect(link.text()).toBe('pages.home.playerPortal.button')
  })

  it('Should render a qr code with its caption', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const qr = wrapper.get('[test-id="portal-qr"]')

    expect(qr.find('[test-id="qr-code"] svg').exists()).toBe(true)
    expect(qr.text()).toBe('pages.home.playerPortal.qr')
  })

  it('Should encode a link to the live page in the qr code', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const svg = wrapper.get('[test-id="portal-qr"] [test-id="qr-code"] svg')

    expect(svg.attributes('viewBox')).toBeTruthy()
    expect(wrapper.get('[test-id="portal-qr"]').html()).toContain('<path')
  })

  it('Should render the player preview inside a phone mockup', async () => {
    wrapper = await mountSuspended(PlayerPortal)

    const mockup = wrapper.get('[test-id="portal-image"]')

    expect(mockup.element.tagName.toLowerCase()).toBe('svg')
    expect(mockup.get('image').attributes('href')).toContain(
      'player-portal.png',
    )
  })
})
