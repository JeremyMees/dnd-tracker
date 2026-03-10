import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomebrewSelectTableRow from '~/components/skeleton/HomebrewSelectTableRow'

describe('SkeletonHomebrewSelectTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(HomebrewSelectTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
