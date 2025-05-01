export default defineNuxtPlugin({
  dependsOn: ['vue-query'],
  async setup(nuxtApp) {
    if (!nuxtApp.payload.serverRendered) {
      await useAuthentication().fetch()
    }
    else if (Boolean(nuxtApp.payload.prerenderedAt) || Boolean(nuxtApp.payload.isCached)) {
      nuxtApp.hook('app:mounted', async () => {
        await useAuthentication().fetch()
      })
    }
  },
})
