import VueDOMPurifyHTML from 'vue-dompurify-html'
import DOMPurify from 'isomorphic-dompurify'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    VueDOMPurifyHTML,
    { enableSSRPropsSupport: true },
    () => DOMPurify,
  )
})
