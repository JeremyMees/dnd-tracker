import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import PrivacyPage from '~/pages/policies/privacy.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = {
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(PrivacyPage, { global: { stubs } })
}

describe('Privacy policy page', () => {
  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Privacy policy')
  })

  it('Should render the privacy policy title', async () => {
    const component = await mountPage()

    expect(component.get('h1').text()).toBe('Privacy Policy for DnD-Tracker')
  })
})
