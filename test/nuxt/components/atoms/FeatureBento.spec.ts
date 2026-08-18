import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import FeatureBento from '~/components/atoms/FeatureBento.vue'

describe('FeatureBento', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render the section heading and text', async () => {
    wrapper = await mountSuspended(FeatureBento)

    expect(wrapper.text()).toContain('pages.home.textBlock2.title')
    expect(wrapper.text()).toContain('pages.home.textBlock2.text')
  })

  it('Should render a cell for every feature with its title and text', async () => {
    wrapper = await mountSuspended(FeatureBento)

    const cells = wrapper.findAll('[test-id="feature-cell"]')

    expect(cells).toHaveLength(5)

    cells.forEach((cell, index) => {
      expect(cell.text()).toContain(
        `pages.home.features.item${index + 1}.title`,
      )
      expect(cell.text()).toContain(`pages.home.features.item${index + 1}.text`)
    })
  })

  it('Should link every cell to its own page', async () => {
    wrapper = await mountSuspended(FeatureBento)

    const links = wrapper.findAll('[test-id="feature-cell"] a')

    expect(links.map(link => link.attributes('href'))).toEqual([
      '/campaigns',
      '/playground',
      '/dnd-content',
      '/campaigns',
      '/fantasy-name-generator',
    ])
  })

  it('Should render decorative artwork that is skipped by screen readers', async () => {
    wrapper = await mountSuspended(FeatureBento)

    const images = wrapper.findAll('[test-id="feature-cell"] img')

    expect(images).toHaveLength(5)
    images.forEach(image => {
      expect(image.attributes('src')).toMatch(/^\/(gifs|art)\//)
      expect(image.attributes('alt')).toBe('')
      expect(image.attributes('loading')).toBe('lazy')
    })
  })

  it('Should make the first cell span the full width of the grid', async () => {
    wrapper = await mountSuspended(FeatureBento)

    const cells = wrapper.findAll('[test-id="feature-cell"]')

    expect(cells[0]!.classes()).toContain('lg:col-span-4')
    cells.slice(1).forEach(cell => {
      expect(cell.classes()).toContain('lg:col-span-2')
    })
  })
})
