import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Index from '~/pages/index.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({
  useSeo: vi.fn(),
}))

mockNuxtImport('useSeo', () => useSeo)

const stubs = { NuxtLayout: nuxtLayoutStub }

async function mountPage() {
  const component = await mountSuspended(Index, { global: { stubs } })

  await flushPromises()

  return component
}

describe('Index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should set the page seo without a title', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith()
  })

  it('Should render the hero', async () => {
    const component = await mountPage()

    expect(component.get('[test-id="hero"]').text()).toContain(
      'components.hero.title',
    )
  })

  it('Should render the player portal section', async () => {
    const component = await mountPage()

    const portal = component.get('[test-id="player-portal"]')

    expect(portal.text()).toContain('pages.home.playerPortal.title')
    expect(portal.findAll('[test-id="portal-item"]')).toHaveLength(3)
    expect(portal.get('[test-id="portal-link"]').attributes('href')).toBe(
      '/live',
    )
  })

  it('Should render every feature cell', async () => {
    const component = await mountPage()

    const cells = component
      .get('[test-id="features"]')
      .findAll('[test-id="feature-cell"]')

    expect(cells).toHaveLength(5)
    cells.forEach((cell, index) => {
      expect(cell.text()).toContain(
        `pages.home.features.item${index + 1}.title`,
      )
    })
  })

  it('Should render the cta banner copy', async () => {
    const component = await mountPage()

    const banner = component.get('[test-id="cta-banner"]')

    expect(banner.text()).toContain('pages.home.ctaBanner.title')
    expect(banner.text()).toContain('pages.home.ctaBanner.text')
    expect(banner.get('[test-id="link"]').text()).toBe(
      'pages.home.ctaBanner.button',
    )
  })

  it('Should render the dragon', async () => {
    const component = await mountPage()

    expect(component.find('[test-id="dragon"]').exists()).toBe(true)
  })

  it('Should move the eyes of the dragon along with the mouse', async () => {
    const component = await mountPage()

    const eye = () => component.get('[test-id="dragon"] > div:first-child')

    expect(eye().attributes('style')).toBeUndefined()

    await component
      .get('[test-id="dragon"]')
      .trigger('mousemove', { clientX: 10, clientY: 20 })

    expect(eye().attributes('style')).toContain('rotate(')
  })

  it('Should render the faq with all its questions', async () => {
    const component = await mountPage()

    const faq = component.get('[test-id="faq"]')

    expect(faq.get('h2').text()).toBe('pages.home.faq.title')
    expect(faq.findAll('button').map(question => question.text())).toEqual([
      'pages.home.faq.item1.title',
      'pages.home.faq.item4.title',
      'pages.home.faq.item2.title',
      'pages.home.faq.item3.title',
    ])
  })

  it('Should reveal the answer of a faq question when it is opened', async () => {
    const component = await mountPage()

    const faq = component.get('[test-id="faq"]')

    expect(faq.text()).not.toContain('pages.home.faq.item4.content')

    await faq.findAll('button')[1]!.trigger('click')
    await flushPromises()

    expect(faq.text()).toContain('pages.home.faq.item4.content')
  })
})
