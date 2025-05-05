import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LimitCta from '~/components/atoms/LimitCta.vue'

describe('LimitCta', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(LimitCta)
    expect(component.html()).toMatchSnapshot()
  })
})
