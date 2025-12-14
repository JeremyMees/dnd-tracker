import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, beforeEach } from 'vitest'
import MasonryGrid from '~/components/templates/MasonryGrid'

interface Props {
  data: any[]
  element?: 'div' | 'ul' | 'ol'
  wrapperStyle?: string
  columnStyle?: string
  maxColumns?: number
}

const mockData = [
  { id: 1, content: 'Item 1' },
  { id: 2, content: 'Item 2' },
  { id: 3, content: 'Item 3' },
  { id: 4, content: 'Item 4' },
  { id: 5, content: 'Item 5' },
]

const props: Props = {
  data: mockData,
  element: 'div',
  wrapperStyle: 'grid gap-4 overflow-y-auto',
  columnStyle: 'flex flex-col gap-4',
  maxColumns: 3,
}

const mockIsSmall = ref(false)
const mockIsLarge = ref(false)

mockNuxtImport('useMediaQuery', () => (query: string) => {
  if (query === '(max-width: 768px)') return mockIsSmall
  if (query === '(min-width: 1440px)') return mockIsLarge
  return ref(false)
})

describe('MasonryGrid', async () => {
  beforeEach(() => {
    mockIsSmall.value = false
    mockIsLarge.value = false
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(MasonryGrid, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render with default props correctly', async () => {
    const component = await mountSuspended(MasonryGrid, { props })
    const div = component.find('div')

    expect(div.attributes('class')).toBe(props.wrapperStyle)
    expect(div.attributes('style')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
  })

  it('Should render with custom element', async () => {
    const component = await mountSuspended(MasonryGrid, {
      props: {
        ...props,
        element: 'ul',
      },
    })

    expect(component.find('ul').exists()).toBeTruthy()
  })

  it('Should render with single column on small screens', async () => {
    mockIsSmall.value = true
    mockIsLarge.value = false

    const component = await mountSuspended(MasonryGrid, { props })
    const div = component.find('div')

    expect(div.attributes('style')).toContain('grid-template-columns: repeat(1, minmax(0, 1fr))')
  })

  it('Should render with two columns on medium screens', async () => {
    mockIsSmall.value = false
    mockIsLarge.value = false

    const component = await mountSuspended(MasonryGrid, { props })
    const div = component.find('div')

    expect(div.attributes('style')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
  })

  it('Should render with three columns on large screens', async () => {
    mockIsSmall.value = false
    mockIsLarge.value = true

    const component = await mountSuspended(MasonryGrid, { props })
    const div = component.find('div')

    expect(div.attributes('style')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  })

  it('Should handle maxColumns prop correctly', async () => {
    const component = await mountSuspended(MasonryGrid, { props: { ...props, maxColumns: 1 } })
    const div = component.find('div')

    expect(div.attributes('style')).toContain('grid-template-columns: repeat(1, minmax(0, 1fr))')
  })

  it('Should handle empty data array', async () => {
    const component = await mountSuspended(MasonryGrid, { props: { ...props, data: [] } })
    const div = component.find('div')

    expect(div.attributes('style')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
  })

  it('Should update columns when screen is resized', async () => {
    const component = await mountSuspended(MasonryGrid, { props })
    const div = component.find('div')

    mockIsSmall.value = false
    mockIsLarge.value = true
    await nextTick()
    expect(div.attributes('style')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')

    mockIsSmall.value = false
    mockIsLarge.value = false
    await nextTick()
    expect(div.attributes('style')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')

    mockIsSmall.value = true
    mockIsLarge.value = false
    await nextTick()
    expect(div.attributes('style')).toContain('grid-template-columns: repeat(1, minmax(0, 1fr))')
  })
})
