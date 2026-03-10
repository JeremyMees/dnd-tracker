import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PasswordToggle from '~/components/form/PasswordToggle'

describe('PasswordToggle', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(PasswordToggle)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render password input by default', async () => {
    const component = await mountSuspended(PasswordToggle)
    const input = component.find('input')

    expect(input.attributes('type')).toBe('password')
  })

  it('Should toggle password visibility', async () => {
    const component = await mountSuspended(PasswordToggle)
    const button = component.find('button')
    const input = component.find('input')

    expect(input.attributes('type')).toBe('password')
    await button.trigger('click')

    expect(input.attributes('type')).toBe('text')
    await button.trigger('click')

    expect(input.attributes('type')).toBe('password')
  })
})
