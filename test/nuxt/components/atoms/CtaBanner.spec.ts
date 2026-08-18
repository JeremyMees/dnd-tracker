import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import CtaBanner from '~/components/atoms/CtaBanner.vue'

const userRef = ref<{ id: string } | null>(null)

mockNuxtImport('useAuthentication', () => () => ({
  user: userRef,
}))

const props = {
  title: 'Test Title',
  subtitle: 'Test Subtitle',
  button: 'Test Button',
}

describe('CtaBanner', async () => {
  beforeEach(() => {
    userRef.value = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render title', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    expect(component.text()).toContain('Test Title')
  })

  it('Should render subtitle', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    expect(component.text()).toContain('Test Subtitle')
  })

  it('Should render button text', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    expect(component.text()).toContain('Test Button')
  })

  it('Should link to /login when user is not logged in', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    const link = component.find('[test-id="link"]')
    expect(link.attributes('href')).toBe('/login')
  })

  it('Should keep the page container on the section and stay full width by default', async () => {
    const component = await mountSuspended(CtaBanner, { props })

    expect(component.get('section').classes()).toContain('dnd-container')
    expect(component.get('section > div').classes()).not.toContain(
      'lg:max-w-md',
    )
  })

  it('Should merge a given class onto the card instead of the section', async () => {
    const component = await mountSuspended(CtaBanner, {
      props: { ...props, class: 'lg:max-w-md' },
    })

    const card = component.get('section > div')

    expect(card.classes()).toContain('lg:max-w-md')
    expect(card.classes()).toContain('rounded-[32px]')
    expect(component.get('section').classes()).not.toContain('lg:max-w-md')
  })

  it('Should link to /pricing when user is logged in', async () => {
    userRef.value = { id: '123' }

    const component = await mountSuspended(CtaBanner, { props })

    const link = component.find('[test-id="link"]')
    expect(link.attributes('href')).toBe('/pricing')
  })
})
