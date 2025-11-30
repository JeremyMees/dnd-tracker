import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

config.global.mocks = {
  $t: (tKey: string) => tKey,
}

config.global.directives = {
  tippy: {},
}

config.global.stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot></slot></a>',
  },
  NuxtLinkLocale: {
    props: ['to'],
    template: '<a :href="to"><slot></slot></a>',
  },
}

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: [
    { code: 'nl', iso: 'nl-BE', name: 'Nederlands' },
    { code: 'en', iso: 'en-US', name: 'English' },
  ],
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)
