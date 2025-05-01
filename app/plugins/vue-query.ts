import { VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin({
  name: 'vue-query',
  parallel: true,
  setup(nuxtApp) {
    nuxtApp.vueApp.use(VueQueryPlugin)
  },
})
