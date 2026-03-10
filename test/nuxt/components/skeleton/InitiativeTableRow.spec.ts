import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import InitiativeTableRow from '~/components/skeleton/InitiativeTableRow'

describe('SkeletonInitiativeTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(InitiativeTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
