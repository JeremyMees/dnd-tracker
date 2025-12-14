import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import MemberRow from '~/components/skeleton/MemberRow'

describe('SkeletonMemberRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(MemberRow)

    expect(component.html()).toMatchSnapshot()
  })
})
