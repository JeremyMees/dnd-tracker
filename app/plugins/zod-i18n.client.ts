import { z } from 'zod'
import type { Composer } from 'vue-i18n'

function localeConfig(code: string): z.core.$ZodConfig {
  return code === 'nl' ? z.locales.nl() : z.locales.en()
}

export default defineNuxtPlugin({
  name: 'zod-i18n',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const { locale } = nuxtApp.$i18n as Composer

    watch(locale, code => z.config(localeConfig(code)), { immediate: true })
  },
})
