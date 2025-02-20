import { serverSupabaseUser } from '#supabase/server'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    event.context.$authorization = {
      resolveServerUser: async () => await serverSupabaseUser(event),
    }
  })
})
