import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import PercentageDial from '~/components/atoms/PercentageDial'

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
    const dial = component.find('[data-test-dial]')

    expect(dial.attributes('stroke-dashoffset')).toBe('-50')

    component.setProps({ value: 30 })
    await nextTick()

    expect(dial.attributes('stroke-dashoffset')).toBe('-70')
  })
})
