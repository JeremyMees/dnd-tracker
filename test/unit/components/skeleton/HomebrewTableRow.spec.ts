import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import HomebrewTableRow from '~/components/skeleton/HomebrewTableRow'

describe('SkeletonHomebrewTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(HomebrewTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
