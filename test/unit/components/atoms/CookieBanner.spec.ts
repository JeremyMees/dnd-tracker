import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import CookieBanner from '~/components/atoms/CookieBanner.vue'

const cookiesConsentRef = ref<boolean | undefined>(undefined)
const cookiesSetRef = ref<boolean | undefined>(undefined)

mockNuxtImport('useCookie', () => (name: string) => {
  if (name === '_dndtracker_cookies_consent') return cookiesConsentRef
  if (name === '_dndtracker_cookies_set') return cookiesSetRef
  return ref(undefined)
})

describe('CookieBanner', async () => {
  beforeEach(() => {
    cookiesConsentRef.value = undefined
    cookiesSetRef.value = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot when banner is visible', async () => {
    const component = await mountSuspended(CookieBanner)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show banner when cookiesSet is not set', async () => {
    const component = await mountSuspended(CookieBanner)

    expect(component.find('[data-test-banner]').exists()).toBeTruthy()
  })

  it('Should hide banner when cookiesSet is true', async () => {
    cookiesSetRef.value = true

    const component = await mountSuspended(CookieBanner)

    expect(component.find('[data-test-banner]').exists()).toBeFalsy()
  })

  it('Should set cookies when consent button is clicked', async () => {
    const component = await mountSuspended(CookieBanner)

    await component.find('[data-test-consent]').trigger('click')

    expect(cookiesConsentRef.value).toBe(true)
    expect(cookiesSetRef.value).toBe(true)
  })

  it('Should render link to cookie policy', async () => {
    const component = await mountSuspended(CookieBanner)

    const link = component.find('[data-test-cookie]')
    expect(link.exists()).toBeTruthy()
    expect(link.attributes('href')).toBe('/policies/cookie')
  })
})
