import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NoAccess from '~/pages/no-access.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = { NuxtLayout: nuxtLayoutStub }

function mountPage() {
  return mountSuspended(NoAccess, { global: { stubs } })
}

describe('No access page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should render the title and text', async () => {
    const component = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(
      'pages.noAccess.title',
    )
    expect(component.get('[test-id="text"]').text()).toBe('pages.noAccess.text')
  })

  it('Should render inside the centered layout', async () => {
    const component = await mountPage()

    expect(component.get('[test-id]').attributes('test-id')).toBe('centered')
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('No access')
  })
})
