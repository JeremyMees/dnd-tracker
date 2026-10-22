import type { VueWrapper } from '@vue/test-utils'
import type { VNodeChild } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollArea } from '~/components/ui/scroll-area'

function mountScrollArea(
  props: Record<string, unknown> = {},
  content: () => VNodeChild = () => 'Content',
) {
  return mountSuspended({
    render: () => h(ScrollArea, props, { default: content }),
  })
}

function viewport(wrapper: VueWrapper): HTMLElement {
  return wrapper.get<HTMLElement>('[data-slot="scroll-area-viewport"]').element
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

  it('Should drop the fade where scroll-driven animations are unsupported', async () => {
    wrapper = await mountScrollArea()

    expect(viewport(wrapper).classList).toContain(
      'not-supports-[animation-timeline:scroll()]:scroll-fade-none',
    )
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

  it('Should expose the scrolling viewport element', async () => {
    wrapper = await mountScrollArea()

    expect(wrapper.findComponent({ name: 'ScrollArea' }).vm.viewport).toBe(
      viewport(wrapper),
    )
  })

  it('Should keep the viewport keyboard-focusable when nothing inside it is', async () => {
    wrapper = await mountScrollArea()

    expect(viewport(wrapper).tabIndex).toBe(0)
  })

  it('Should leave focus to the content when it holds a focusable element', async () => {
    wrapper = await mountScrollArea({}, () => h('button', 'Save'))

    expect(viewport(wrapper).tabIndex).toBe(-1)
  })

  it('Should become focusable again once the focusable content disables', async () => {
    const disabled = ref(false)

    wrapper = await mountScrollArea({}, () =>
      h('button', { disabled: disabled.value }, 'Save'),
    )

    disabled.value = true

    await vi.waitFor(() => expect(viewport(wrapper!).tabIndex).toBe(0))
  })
})
