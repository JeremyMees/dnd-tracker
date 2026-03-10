import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CampaignTableRow from '~/components/skeleton/CampaignTableRow'

describe('SkeletonCampaignTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(CampaignTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
