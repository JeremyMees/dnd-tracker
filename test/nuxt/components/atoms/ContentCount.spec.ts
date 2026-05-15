import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCount from '~/components/atoms/ContentCount.vue'

interface Props {
  count: number | undefined
  max: number
  loading?: boolean
}

const props: Props = {
  count: 1,
  max: 2,
}

describe('ContentCount', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCount, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render with default props correctly', async () => {
    const component = await mountSuspended(ContentCount, { props })

    expect(component.find('[data-test-count]').text()).toBe(`${props.count}/${props.max}`)
  })

  it('Should render a zero count', async () => {
    const component = await mountSuspended(ContentCount, { props: { ...props, count: 0 } })

    expect(component.find('[data-test-count]').text()).toBe(`0/${props.max}`)
  })

  it('Should render a loading state', async () => {
    const component = await mountSuspended(ContentCount, { props: { ...props, loading: true } })

    expect(component.find('[data-test-skeleton]').exists()).toBeTruthy()

    component.setProps({ loading: false, count: undefined })
    await nextTick()

    expect(component.find('[data-test-skeleton]').exists()).toBeTruthy()
  })

  it('Should render red text when count is greater or equal to max', async () => {
    const component = await mountSuspended(ContentCount, { props: { ...props, count: 2 } })

    expect(component.find('[data-test-count]').attributes('class')).toContain('text-destructive')
  })
})
