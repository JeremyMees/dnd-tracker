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

  it('Should render both text blocks with their title and text', async () => {
    const component = await mountPage()

    const blocks = component.findAll('[test-id="text-block"]')

    expect(blocks).toHaveLength(2)
    expect(blocks[0]!.get('h2').text()).toBe('pages.home.textBlock1.title')
    expect(blocks[0]!.get('p').text()).toBe('pages.home.textBlock1.text')
    expect(blocks[1]!.get('h2').text()).toBe('pages.home.textBlock2.title')
    expect(blocks[1]!.get('p').text()).toBe('pages.home.textBlock2.text')
  })

  it('Should render the dragon next to the text blocks', async () => {
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

  it('Should render the summary with all its items', async () => {
    const component = await mountPage()

    const summary = component.get('[test-id="summary"]')

    expect(summary.get('h2').text()).toBe('pages.home.summary.title')
    expect(summary.findAll('li').map(item => item.text())).toEqual([
      'pages.home.summary.item1',
      'pages.home.summary.item2',
      'pages.home.summary.item3',
      'pages.home.summary.item4',
      'pages.home.summary.item5',
      'pages.home.summary.item6',
    ])
  })

  it('Should render the flame artwork next to the summary', async () => {
    const component = await mountPage()

    const flame = component.get('[test-id="flame"]')

    expect(flame.attributes('src')).toBe('/art/flame.svg')
    expect(flame.attributes('alt')).toBe('Hearth')
  })

  it('Should render the scroll container with the initiative sheet', async () => {
    const component = await mountPage()

    const container = component.get('[test-id="container-scroll"]')

    expect(container.get('[test-id="container-scroll-title"]').text()).toBe(
      'pages.home.containerScroll.title',
    )
    expect(container.get('[test-id="container-scroll-subtitle"]').text()).toBe(
      'pages.home.containerScroll.subtitle',
    )
    expect(
      container.get('[test-id="container-scroll-image"]').attributes('src'),
    ).toContain('initiative-sheet.png')
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

  it('Should render the faq with all its questions', async () => {
    const component = await mountPage()

    const faq = component.get('[test-id="faq"]')

    expect(faq.get('h2').text()).toBe('pages.home.faq.title')
    expect(faq.findAll('button').map(question => question.text())).toEqual([
      'pages.home.faq.item1.title',
      'pages.home.faq.item2.title',
      'pages.home.faq.item3.title',
    ])
  })

  it('Should reveal the answer of a faq question when it is opened', async () => {
    const component = await mountPage()

    const faq = component.get('[test-id="faq"]')

    expect(faq.text()).not.toContain('pages.home.faq.item2.content')

    await faq.findAll('button')[1]!.trigger('click')
    await flushPromises()

    expect(faq.text()).toContain('pages.home.faq.item2.content')
  })
})
