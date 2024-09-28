import { VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(VueQueryPlugin)
})
