import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import List from '~/components/skeleton/List'

describe('SkeletonList', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(List)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should match snapshot with custom props', async () => {
    const component = await mountSuspended(List, {
      props: { rows: 3, amount: 15 },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have default props', async () => {
    const component = await mountSuspended(List)

    expect(component.props('rows')).toBe(2)
    expect(component.props('amount')).toBe(10)
  })
})
