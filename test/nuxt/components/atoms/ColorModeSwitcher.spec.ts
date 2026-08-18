import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ColorModeSwitcher from '~/components/atoms/ColorModeSwitcher.vue'
import { Select } from '~/components/ui/select'

describe('ColorModeSwitcher', async () => {
  it('Should match snapshot', async () => {
    const colorMode = reactive({ preference: 'system' })

    const component = await mountSuspended(ColorModeSwitcher, {
      global: { mocks: { $colorMode: colorMode } },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the select bound to the current color mode preference', async () => {
    const colorMode = reactive({ preference: 'dark' })

    const component = await mountSuspended(ColorModeSwitcher, {
      global: { mocks: { $colorMode: colorMode } },
    })

    const select = component.findComponent(Select)
    expect(select.props('modelValue')).toBe('dark')
  })

  it('Should update the color mode preference when the select changes', async () => {
    const colorMode = reactive({ preference: 'light' })

    const component = await mountSuspended(ColorModeSwitcher, {
      global: { mocks: { $colorMode: colorMode } },
    })

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'dark')

    expect(colorMode.preference).toBe('dark')
  })
})
