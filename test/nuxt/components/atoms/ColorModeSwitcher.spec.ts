import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ColorModeSwitcher from '~/components/atoms/ColorModeSwitcher.vue'
import { Select } from '~/components/ui/select'

const { colorMode } = vi.hoisted(() => ({
  colorMode: { preference: 'system' },
}))

mockNuxtImport('useColorMode', () => () => colorMode)

describe('ColorModeSwitcher', async () => {
  beforeEach(() => {
    colorMode.preference = 'system'
  })

  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition')
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(ColorModeSwitcher)

    expect(component.html()).toMatchSnapshot()

    component.unmount()
  })

  it('Should render the select bound to the current color mode preference', async () => {
    colorMode.preference = 'dark'

    const component = await mountSuspended(ColorModeSwitcher)

    const select = component.findComponent(Select)
    expect(select.props('modelValue')).toBe('dark')

    component.unmount()
  })

  it('Should update the color mode preference when the select changes', async () => {
    colorMode.preference = 'light'

    const component = await mountSuspended(ColorModeSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'dark')

    expect(colorMode.preference).toBe('dark')

    component.unmount()
  })

  it('Should reveal the new color mode from the switcher position', async () => {
    const startViewTransition = vi.fn((callback: () => unknown) => {
      callback()

      const finished = Promise.resolve()

      return { finished, ready: finished, updateCallbackDone: finished }
    })

    Object.defineProperty(document, 'startViewTransition', {
      value: startViewTransition,
      configurable: true,
      writable: true,
    })

    const component = await mountSuspended(ColorModeSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'dark')

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(colorMode.preference).toBe('dark')

    component.unmount()
  })
})
