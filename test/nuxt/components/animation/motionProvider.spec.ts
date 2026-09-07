import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { m } from 'motion-v'
import MotionProvider from '~/components/animation/MotionProvider.vue'

const Animated = defineComponent({
  setup() {
    return () =>
      h(
        m.h1,
        {
          'test-id': 'animated',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.05 },
        },
        () => 'title',
      )
  },
})

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount() {
  wrapper = await mountSuspended(MotionProvider, {
    slots: { default: () => h(Animated) },
  })

  return wrapper
}

describe('Motion provider', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render slot content without adding an element of its own', async () => {
    const component = await mount()

    expect(component.html()).toMatch(/^<h1/)
    expect(component.text()).toBe('title')
  })

  it('Should render the tag requested by the motion component', async () => {
    const component = await mount()

    expect(component.get('[test-id="animated"]').element.tagName).toBe('H1')
  })

  it('Should hand animation features to nested motion components', async () => {
    const component = await mount()
    const animated = component.get('[test-id="animated"]')

    expect(animated.attributes('style')).toContain('opacity: 0')

    await vi.waitFor(() =>
      expect(animated.attributes('style')).toContain('opacity: 1'),
    )
  })

  it('Should not animate a motion component rendered outside of it', async () => {
    wrapper = await mountSuspended(Animated)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.get('[test-id="animated"]').attributes('style')).toContain(
      'opacity: 0',
    )
  })
})
