export default defineNuxtPlugin({
  name: 'session-fetch-plugin',
  enforce: 'pre',
  dependsOn: ['vue-query'],
  async setup(nuxtApp) {
    // Flag if request is cached
    nuxtApp.payload.isCached = Boolean(useRequestEvent()?.context.cache)
    if (nuxtApp.payload.serverRendered && !nuxtApp.payload.prerenderedAt && !nuxtApp.payload.isCached) {
      await useAuthentication().fetch()
    }
  },
})
