import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CookiePage from '~/pages/policies/cookie.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = {
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(CookiePage, { global: { stubs } })
}

describe('Cookie policy page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Cookie policy')
  })

  it('Should render the cookie policy title', async () => {
    const component = await mountPage()

    expect(component.get('h1').text()).toBe('Cookie Policy for DnD-Tracker')
  })
})
