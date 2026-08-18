import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PercentageDial from '~/components/atoms/PercentageDial.vue'

interface Props {
  limit: number
  value: number
}

const props: Props = {
  limit: 100,
  value: 50,
}

describe('PercentageDial', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(PercentageDial, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should set stroke-dashoffset to the correct value', async () => {
    const component = await mountSuspended(PercentageDial, { props })
    const dial = component.find('[test-id="dial"]')

    expect(dial.attributes('stroke-dashoffset')).toBe('-50')

    component.setProps({ value: 30 })
    await nextTick()

    expect(dial.attributes('stroke-dashoffset')).toBe('-70')
  })

  it('Should apply destructive color when value equals limit', async () => {
    const component = await mountSuspended(PercentageDial, {
      props: { limit: 100, value: 100 },
    })
    const dial = component.find('[test-id="dial"]')

    expect(dial.classes()).toContain('text-destructive')
    expect(dial.classes()).not.toContain('text-primary')
  })

  it('Should apply primary color when value is below limit', async () => {
    const component = await mountSuspended(PercentageDial, { props })
    const dial = component.find('[test-id="dial"]')

    expect(dial.classes()).toContain('text-primary')
    expect(dial.classes()).not.toContain('text-destructive')
  })
})
