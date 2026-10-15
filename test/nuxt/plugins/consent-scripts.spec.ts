import { describe, expect, it, vi } from 'vitest'
import consentScriptsPlugin from '~/plugins/consent-scripts.client'

const { gtag } = vi.hoisted(() => ({
  gtag: vi.fn((options: object) => ({ vendor: 'gtag', ...options })),
}))

vi.mock('@c15t/integrations/google-tag', () => ({ gtag }))
vi.unmock('~/plugins/consent-scripts.client')

describe('consent-scripts plugin', () => {
  it('registers gtag behind measurement consent with the configured id', () => {
    const nuxtApp = useNuxtApp()
    useRuntimeConfig().public.gId = 'G-TEST'

    nuxtApp.runWithContext(() => consentScriptsPlugin(nuxtApp))

    expect(useAppConfig().c15t?.scripts).toEqual([
      {
        vendor: 'gtag',
        id: 'G-TEST',
        category: 'measurement',
        loadMode: 'after-consent',
      },
    ])
  })
})
