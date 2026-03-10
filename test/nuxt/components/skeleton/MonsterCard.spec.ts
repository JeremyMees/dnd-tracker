import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import MonsterCard from '~/components/skeleton/MonsterCard'

describe('SkeletonMonsterCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(MonsterCard)

    expect(component.html()).toMatchSnapshot()
  })
})
