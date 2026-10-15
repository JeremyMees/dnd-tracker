import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import sentrySupabasePlugin from '~/plugins/sentry-supabase.client'

const { addIntegration, supabaseIntegration, supabaseClient, integration } =
  vi.hoisted(() => ({
    addIntegration: vi.fn(),
    supabaseIntegration: vi.fn(),
    supabaseClient: { from: () => ({}) },
    integration: { name: 'Supabase' },
  }))

vi.mock('@sentry/nuxt', () => ({ addIntegration, supabaseIntegration }))
vi.unmock('~/plugins/sentry-supabase.client')

mockNuxtImport('useSupabaseClient', () => () => supabaseClient)

describe('sentry-supabase plugin', () => {
  it('waits for the Sentry client and the Supabase client', () => {
    expect(sentrySupabasePlugin.dependsOn).toEqual(
      expect.arrayContaining(['sentry-client-config', 'supabase']),
    )
  })

  it('instruments the app Supabase client', async () => {
    supabaseIntegration.mockReturnValue(integration)

    const nuxtApp = useNuxtApp()

    await nuxtApp.runWithContext(() => sentrySupabasePlugin(nuxtApp))

    expect(supabaseIntegration).toHaveBeenCalledWith({ supabaseClient })
    expect(addIntegration).toHaveBeenCalledWith(integration)
  })
})
