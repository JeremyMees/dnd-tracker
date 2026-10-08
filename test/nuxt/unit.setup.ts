import { config, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { resetNames, stubNamesEndpoint } from '~~/test/nuxt/stubs/names'
import { NuxtLinkLocaleStub } from '~~/test/nuxt/stubs/locale'

enableAutoUnmount(afterEach)

stubNamesEndpoint()

beforeEach(() => resetNames())

config.global.mocks = {
  $t: (tKey: string) => tKey,
}

config.global.directives = {
  'auto-animate': {},
}

config.global.stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot></slot></a>',
  },
  NuxtLinkLocale: NuxtLinkLocaleStub,
  AnimationExpand: {
    template: '<div><slot></slot></div>',
  },
}

// Disable payload extraction in tests
vi.mock('~/plugins/payload.client', () => ({
  default: () => {},
}))

vi.mock('~/plugins/session.client', () => ({
  default: () => {},
}))

vi.mock('@formkit/auto-animate/vue', () => ({
  vAutoAnimate: {},
}))

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: [
    { code: 'nl', language: 'nl-BE', name: 'Nederlands', icon: '🇧🇪' },
    { code: 'en', language: 'en-US', name: 'English', icon: '🇬🇧' },
  ],
}))

mockNuxtImport('useLocalePath', async () => {
  const { localeHref } = await import('~~/test/nuxt/stubs/locale')

  return () => localeHref
})

mockNuxtImport('useMarkdown', () => () => ({
  renderMarkdown: (mdText: string) => mdText,
}))
