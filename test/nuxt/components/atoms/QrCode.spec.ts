import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import QrCode from '~/components/atoms/QrCode.vue'

describe('QrCode', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(QrCode, {
      props: { value: 'https://example.com' },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render an svg for the given value', async () => {
    const component = await mountSuspended(QrCode, {
      props: { value: 'https://example.com' },
    })

    expect(component.find('[test-id="qr-code"] svg').exists()).toBe(true)
  })

  it('Should regenerate the svg when the value changes', async () => {
    const component = await mountSuspended(QrCode, {
      props: { value: 'https://example.com/a' },
    })
    const first = component.find('[test-id="qr-code"] svg').html()

    await component.setProps({ value: 'https://example.com/b' })

    const second = component.find('[test-id="qr-code"] svg').html()

    expect(first).not.toBe(second)
  })

  it('Should regenerate the same svg when the value changes', async () => {
    const component = await mountSuspended(QrCode, {
      props: { value: 'https://example.com/a' },
    })
    const first = component.find('[test-id="qr-code"] svg').html()

    await component.setProps({ value: 'https://example.com/b' })
    await component.setProps({ value: 'https://example.com/a' })

    const second = component.find('[test-id="qr-code"] svg').html()

    expect(first).toBe(second)
  })
})
