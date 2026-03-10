import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCard from '~/components/skeleton/ContentCard'

describe('SkeletonContentCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCard)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should match snapshot with variant background', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { variant: 'background' },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have default variant secondary', async () => {
    const component = await mountSuspended(ContentCard)

    expect(component.props('variant')).toBe('secondary')
  })
})
