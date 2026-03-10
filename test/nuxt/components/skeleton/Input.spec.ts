import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Input from '~/components/skeleton/Input'

describe('SkeletonInput', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Input)

    expect(component.html()).toMatchSnapshot()
  })
})
