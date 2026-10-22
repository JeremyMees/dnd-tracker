import { serverSupabaseUser } from '#supabase/server'

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('request', event => {
    event.context.$authorization = {
      resolveServerUser: () => serverSupabaseUser(event),
    }
  })
})
