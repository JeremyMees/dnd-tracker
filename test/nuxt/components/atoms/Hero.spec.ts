import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Hero from '~/components/atoms/Hero.vue'

describe('Hero', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Hero)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render translated title and description', async () => {
    const component = await mountSuspended(Hero)

    expect(component.text()).toContain('components.hero.title')
    expect(component.text()).toContain('components.hero.description')
  })

  it('Should render translated start and try labels', async () => {
    const component = await mountSuspended(Hero)

    expect(component.text()).toContain('components.hero.start')
    expect(component.text()).toContain('components.hero.try')
  })

  it('Should link the start button to /campaigns', async () => {
    const component = await mountSuspended(Hero)

    const links = component.findAll('a')
    const startLink = links.find(
      link => link.text() === 'components.hero.start',
    )

    expect(startLink?.attributes('href')).toBe('/campaigns')
  })

  it('Should render the campaign preview under the hero copy', async () => {
    const component = await mountSuspended(Hero)

    const preview = component.get('[test-id="hero-preview"]')

    expect(preview.get('img').attributes('src')).toContain('campaign.png')
    expect(preview.get('img').attributes('alt')).toBeTruthy()
  })

  it('Should link the try button to /playground', async () => {
    const component = await mountSuspended(Hero)

    const links = component.findAll('a')
    const tryLink = links.find(link =>
      link.text().includes('components.hero.try'),
    )

    expect(tryLink?.attributes('href')).toBe('/playground')
  })
})
