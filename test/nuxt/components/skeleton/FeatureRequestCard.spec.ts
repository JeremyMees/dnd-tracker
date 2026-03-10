import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FeatureRequestCard from '~/components/skeleton/FeatureRequestCard'

describe('SkeletonFeatureRequestCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(FeatureRequestCard)

    expect(component.html()).toMatchSnapshot()
  })
})
