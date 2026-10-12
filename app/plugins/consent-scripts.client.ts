import { gtag } from '@c15t/integrations/google-tag'

export default defineNuxtPlugin(() => {
  const { gId } = useRuntimeConfig().public

  updateAppConfig({
    c15t: {
      scripts: [
        gtag({ id: gId, category: 'measurement', loadMode: 'after-consent' }),
      ],
    },
  })
})
