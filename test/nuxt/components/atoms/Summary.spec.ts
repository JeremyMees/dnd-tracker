import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Summary from '~/components/atoms/Summary.vue'

const props = {
  title: 'Test Title',
  items: ['Item 1', 'Item 2', 'Item 3'],
}

describe('Summary', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Summary, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct default props', async () => {
    const component = await mountSuspended(Summary)

    expect(component.props('title')).toBe('')
    expect(component.props('items')).toEqual([])
  })

  it('Should render title when provided', async () => {
    const component = await mountSuspended(Summary, { props })

    expect(component.text()).toContain('Test Title')
  })

  it('Should not render title when not provided', async () => {
    const component = await mountSuspended(Summary)

    expect(component.find('h2').exists()).toBeFalsy()
  })

  it('Should render items', async () => {
    const component = await mountSuspended(Summary, { props })

    expect(component.text()).toContain('Item 1')
    expect(component.text()).toContain('Item 2')
    expect(component.text()).toContain('Item 3')
  })

  it('Should render correct number of list items', async () => {
    const component = await mountSuspended(Summary, { props })

    const listItems = component.findAll('li')
    expect(listItems).toHaveLength(3)
  })

  it('Should render empty list when no items provided', async () => {
    const component = await mountSuspended(Summary)

    const listItems = component.findAll('li')
    expect(listItems).toHaveLength(0)
  })
})
