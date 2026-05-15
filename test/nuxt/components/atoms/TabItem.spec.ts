import { mockNuxtImport, mountSuspended, mockComponent } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import TabItem from '~/components/atoms/TabItem.vue'

interface Props {
  link: string
  icon: string
  label: string
  disabled: boolean
}

const props: Props = {
  link: '/home',
  icon: 'home',
  label: 'Home',
  disabled: false,
}

mockComponent('Icon', {
  template: '<span data-testid="icon" />',
})

describe('TabItem', async () => {
  mockNuxtImport('useRoute', () => () => ({
    fullPath: '/home',
  }))

  it('Should match snapshot', async () => {
    const component = await mountSuspended(TabItem, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show inactive state', async () => {
    const component = await mountSuspended(TabItem, { props: { ...props, link: '/other-path' } })

    expect(component.attributes('class')).toContain('bg-secondary/50 lg:border-transparent')
  })

  it('Should show active state', async () => {
    const component = await mountSuspended(TabItem, { props })

    expect(component.attributes('class')).toContain('bg-primary/50 lg:border-primary')
  })

  it('Should show disabled state', async () => {
    const component = await mountSuspended(TabItem, { props: { ...props, disabled: true } })

    expect(component.attributes('class')).toContain('pointer-events-none opacity-50')
  })
})
