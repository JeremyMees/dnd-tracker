import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NoAccess from '~/pages/no-access.vue'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

const stubs = {
  NuxtLayout: {
    props: ['name'],
    template:
      '<div :data-test-layout="name"><slot name="header" /><slot /></div>',
  },
}

function mountPage() {
  return mountSuspended(NoAccess, { global: { stubs } })
}

describe('No access page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should render the title and text', async () => {
    const component = await mountPage()

    expect(component.get('[data-test-title]').text()).toBe(
      'pages.noAccess.title',
    )
    expect(component.get('[data-test-text]').text()).toBe('pages.noAccess.text')
  })

  it('Should render inside the centered layout', async () => {
    const component = await mountPage()

    expect(
      component.get('[data-test-layout]').attributes('data-test-layout'),
    ).toBe('centered')
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('No access')
  })
})
