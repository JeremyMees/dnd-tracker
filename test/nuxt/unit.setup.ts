import { config, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import * as dndHelpers from '~~/shared/utils/dnd/names'

enableAutoUnmount(afterEach)

let nameIndex = 0

beforeEach(() => {
  nameIndex = 0
  vi.spyOn(dndHelpers, 'randomName').mockImplementation(
    () => `Test Name ${++nameIndex}`,
  )
})

config.global.mocks = {
  $t: (tKey: string) => tKey,
}

config.global.directives = {
  tippy: {},
  'auto-animate': {},
  dompurifyHtml: (el, binding) => {
    el.innerHTML = binding.value
  },
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

mockNuxtImport('useLocalePath', () => () => (path: string) => path)

mockNuxtImport('useMarkdown', () => () => ({
  renderMarkdown: (mdText: string) => mdText,
}))
