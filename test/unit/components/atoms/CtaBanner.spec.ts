import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import CtaBanner from '~/components/atoms/CtaBanner.vue'

const userRef = ref<{ id: string }>(null)

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

    const link = component.find('[data-test-link]')
    expect(link.attributes('href')).toBe('/login')
  })

  it('Should link to /pricing when user is logged in', async () => {
    userRef.value = { id: '123' }

    const component = await mountSuspended(CtaBanner, { props })

    const link = component.find('[data-test-link]')
    expect(link.attributes('href')).toBe('/pricing')
  })
})
