import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EncounterTableRow from '~/components/skeleton/EncounterTableRow'

describe('SkeletonEncounterTableRow', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(EncounterTableRow)

    expect(component.html()).toMatchSnapshot()
  })
})
