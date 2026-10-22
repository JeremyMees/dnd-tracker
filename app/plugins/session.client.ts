export default defineNuxtPlugin({
  dependsOn: ['vue-query'],
  async setup(nuxtApp) {
    const { user, fetch } = useAuthentication()

    useSupabaseClient().auth.onAuthStateChange(event => {
      if (
        ['USER_UPDATED', 'SIGNED_IN'].includes(event) ||
        (event === 'INITIAL_SESSION' && !user.value)
      )
        fetch().catch(() => {})
    })

    if (!nuxtApp.payload.serverRendered) {
      await fetch()
    } else if (
      Boolean(nuxtApp.payload.prerenderedAt) ||
      Boolean(nuxtApp.payload.isCached)
    ) {
      nuxtApp.hook('app:mounted', async () => {
        await fetch()
      })
    }
  },
})
