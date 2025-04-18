import Ybug from 'ybug-vue'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    nuxtApp.vueApp.use(Ybug, {
      id: 'x8sg2t11mj77w9bhat8k',
      settings: {
        hide_launcher: true,
      },
    })
  }
})
