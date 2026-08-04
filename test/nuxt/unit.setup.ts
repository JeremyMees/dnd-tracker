import { config } from '@vue/test-utils'
import { beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import * as dndHelpers from '~~/shared/utils/dnd/names'

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
  autoAnimate: {},
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
}

// Disable payload extraction in tests
vi.mock('~/plugins/payload.client', () => ({
  default: () => {},
}))

vi.mock('~/plugins/session.client', () => ({
  default: () => {},
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
