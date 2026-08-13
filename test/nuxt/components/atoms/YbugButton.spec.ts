import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import YbugButton from '~/components/atoms/YbugButton.vue'

describe('YbugButton', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(YbugButton, {
      props: { type: 'menu' },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should open the ybug feedback widget when clicked as a menu button', async () => {
    const open = vi.fn()

    const component = await mountSuspended(YbugButton, {
      props: { type: 'menu' },
      global: { mocks: { $ybug: { open } } },
    })

    await component.get('button').trigger('click')

    expect(open).toHaveBeenCalledWith('feedback')
  })

  it('Should open the ybug feedback widget when clicked as a footer button', async () => {
    const open = vi.fn()

    const component = await mountSuspended(YbugButton, {
      props: { type: 'footer' },
      global: { mocks: { $ybug: { open } } },
    })

    await component.get('button').trigger('click')

    expect(open).toHaveBeenCalledWith('feedback')
  })

  it('Should not throw when ybug is not available', async () => {
    const component = await mountSuspended(YbugButton, {
      props: { type: 'menu' },
      global: { mocks: { $ybug: undefined } },
    })

    await expect(
      component.get('button').trigger('click'),
    ).resolves.not.toThrow()
  })

  it('Should apply menu specific classes when type is menu', async () => {
    const component = await mountSuspended(YbugButton, {
      props: { type: 'menu' },
    })

    expect(component.get('button').classes()).toEqual(
      expect.arrayContaining(['gap-2', 'w-full', 'cursor-pointer']),
    )
  })

  it('Should apply footer specific classes when type is footer', async () => {
    const component = await mountSuspended(YbugButton, {
      props: { type: 'footer' },
    })

    expect(component.get('button').classes()).not.toEqual(
      expect.arrayContaining(['gap-2', 'w-full', 'cursor-pointer']),
    )
  })
})
