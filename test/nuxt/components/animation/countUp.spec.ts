import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CountUp from '~/components/animation/CountUp.vue'

const reduced = ref<boolean>(false)

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(),
}))

mockNuxtImport('useReducedMotion', () => useReducedMotionMock)

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount(props: {
  value: number
  duration?: number
  delay?: number
}) {
  wrapper = await mountSuspended(CountUp, { props })

  return wrapper
}

describe('Count up', () => {
  beforeEach(() => {
    reduced.value = false
    useReducedMotionMock.mockReturnValue(reduced)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should start from zero before the animation runs', async () => {
    const component = await mount({ value: 46 })

    expect(component.text()).toBe('0')
  })

  it('Should reach the target value', async () => {
    const component = await mount({ value: 46, duration: 0.05 })

    await vi.waitFor(() => expect(component.text()).toBe('46'))
  })

  it('Should only ever render whole numbers', async () => {
    const component = await mount({ value: 37, duration: 0.1 })

    await vi.waitFor(() => expect(component.text()).toBe('37'))
    expect(component.text()).not.toContain('.')
  })

  it('Should render the value immediately when motion is reduced', async () => {
    reduced.value = true

    const component = await mount({ value: 46 })

    expect(component.text()).toBe('46')
  })

  it('Should not animate a reduced-motion value on change', async () => {
    reduced.value = true

    const component = await mount({ value: 10 })

    await component.setProps({ value: 99 })

    expect(component.text()).toBe('99')
  })

  it('Should animate towards a new value when the prop changes', async () => {
    const component = await mount({ value: 10, duration: 0.05 })

    await vi.waitFor(() => expect(component.text()).toBe('10'))
    await component.setProps({ value: 99 })
    await vi.waitFor(() => expect(component.text()).toBe('99'))
  })

  it('Should settle immediately when the value does not change', async () => {
    const component = await mount({ value: 7, duration: 0.05 })

    await vi.waitFor(() => expect(component.text()).toBe('7'))
    await component.setProps({ value: 7 })

    expect(component.text()).toBe('7')
  })

  it('Should handle a zero target', async () => {
    const component = await mount({ value: 0 })

    expect(component.text()).toBe('0')
  })

  it('Should expose a count-up hook for styling', async () => {
    const component = await mount({ value: 5 })

    expect(component.find('[test-id="count-up"]').exists()).toBe(true)
  })
})
