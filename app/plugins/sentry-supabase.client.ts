import { addIntegration, supabaseIntegration } from '@sentry/nuxt'

export default defineNuxtPlugin({
  name: 'sentry-supabase',
  dependsOn: ['sentry-client-config', 'supabase'],
  setup() {
    addIntegration(supabaseIntegration({ supabaseClient: useSupabaseClient() }))
  },
})
