import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LegalPage from '~/pages/policies/legal.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = {
  NuxtLayout: nuxtLayoutStub,
}

function mountPage() {
  return mountSuspended(LegalPage, { global: { stubs } })
}

describe('Legal information page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Legal information')
  })

  it('Should render the legal information title', async () => {
    const component = await mountPage()

    expect(component.get('h1').text()).toBe('Legal Information')
  })
})
