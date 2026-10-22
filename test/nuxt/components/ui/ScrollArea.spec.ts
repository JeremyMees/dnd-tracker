import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { ScrollArea } from '~/components/ui/scroll-area'

function mountScrollArea(props: Record<string, unknown> = {}) {
  return mountSuspended({
    render: () => h(ScrollArea, props, { default: () => 'Content' }),
  })
}

function viewport(wrapper: VueWrapper): Element {
  return wrapper.find('[data-slot="scroll-area-viewport"]').element
}

describe('ScrollArea', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should fade the vertical edges of the viewport by default', async () => {
    wrapper = await mountScrollArea()

    expect(viewport(wrapper).classList).toContain('scroll-fade')
    expect(
      wrapper
        .findComponent({ name: 'ScrollAreaScrollbar' })
        .props('orientation'),
    ).toBe('vertical')
  })

  it('Should fade the horizontal edges and use a horizontal scrollbar when horizontal', async () => {
    wrapper = await mountScrollArea({ orientation: 'horizontal' })

    expect(viewport(wrapper).classList).toContain('scroll-fade-x')
    expect(viewport(wrapper).classList).not.toContain('scroll-fade')
    expect(
      wrapper
        .findComponent({ name: 'ScrollAreaScrollbar' })
        .props('orientation'),
    ).toBe('horizontal')
  })

  it('Should put viewport classes on the viewport and root classes on the root', async () => {
    wrapper = await mountScrollArea({
      class: 'flex-1',
      viewportClass: 'max-h-48',
    })

    expect(viewport(wrapper).classList).toContain('max-h-48')
    expect(wrapper.find('[data-slot="scroll-area"]').classes()).toContain(
      'flex-1',
    )
  })
})
