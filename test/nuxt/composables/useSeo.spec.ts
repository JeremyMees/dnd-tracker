import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import seo from '~~/constants/seo'
import { useSeo } from '~/composables/useSeo'

const {
  defineOrganization,
  defineWebPage,
  defineWebSite,
  useHead,
  useSchemaOrg,
  useSeoMeta,
} = vi.hoisted(() => ({
  defineOrganization: vi.fn((options: unknown) => ({
    type: 'organization',
    options,
  })),
  defineWebPage: vi.fn((options: unknown) => ({ type: 'webPage', options })),
  defineWebSite: vi.fn((options: unknown) => ({ type: 'webSite', options })),
  useHead: vi.fn(),
  useSchemaOrg: vi.fn(),
  useSeoMeta: vi.fn(),
}))

mockNuxtImport('useHead', () => useHead)
mockNuxtImport('useSeoMeta', () => useSeoMeta)
mockNuxtImport('useSchemaOrg', () => useSchemaOrg)
mockNuxtImport('defineOrganization', () => defineOrganization)
mockNuxtImport('defineWebPage', () => defineWebPage)
mockNuxtImport('defineWebSite', () => defineWebSite)

const locale = ref('en')
const availableLocales = ['en', 'nl']

mockNuxtImport('useI18n', () => () => ({
  locale,
  availableLocales,
}))

const Probe = defineComponent({
  props: { title: { type: String, required: false, default: undefined } },
  setup(props) {
    useSeo(props.title)

    return {}
  },
  template: '<div />',
})

async function mountProbe(title?: string) {
  const component = await mountSuspended(Probe, { props: { title } })

  await flushPromises()

  return component
}

describe('useSeo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    locale.value = 'en'
  })

  it('sets the html lang attribute from the current locale', async () => {
    locale.value = 'nl'

    await mountProbe('Profile')

    expect(useHead).toHaveBeenCalledWith(
      expect.objectContaining({ htmlAttrs: { lang: 'nl' } }),
    )
  })

  it('passes the title through and sets the favicon and keywords', async () => {
    await mountProbe('Profile')

    expect(useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Profile',
        link: [{ rel: 'icon', type: 'image/ico', href: '/favicon.ico' }],
        meta: [{ name: 'keywords', content: seo.keywords }],
      }),
    )
  })

  it('omits the title key entirely when no title is given', async () => {
    await mountProbe()

    const options = useHead.mock.calls[0]![0] as Record<string, unknown>

    expect('title' in options).toBe(false)
  })

  it('suffixes the page title with the site name', async () => {
    await mountProbe('Profile')

    const options = useHead.mock.calls[0]![0] as {
      titleTemplate: (title?: string) => string
    }

    expect(options.titleTemplate('Profile')).toBe(`Profile | ${seo.name}`)
  })

  it('does not suffix the title when it is a locale code, treating it as the homepage', async () => {
    await mountProbe('en')

    const options = useHead.mock.calls[0]![0] as {
      titleTemplate: (title?: string) => string
    }

    expect(options.titleTemplate('en')).toBe(seo.name)
  })

  it('falls back to the site name when no title is given to the template', async () => {
    await mountProbe()

    const options = useHead.mock.calls[0]![0] as {
      titleTemplate: (title?: string) => string
    }

    expect(options.titleTemplate(undefined)).toBe(seo.name)
  })

  it('sets the social meta tags from the seo constants', async () => {
    await mountProbe('Profile')

    expect(useSeoMeta).toHaveBeenCalledWith({
      ogUrl: seo.url,
      ogImage: seo.socials,
      twitterImage: seo.socials,
      twitterTitle: seo.title,
      twitterDescription: seo.description,
    })
  })

  it('registers the organization, webpage and website schema', async () => {
    await mountProbe('Profile')

    expect(defineOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        name: seo.name,
        url: seo.url,
        sameAs: ['https://www.instagram.com/dnd.tracker/'],
      }),
    )
    expect(defineWebPage).toHaveBeenCalledWith({ name: 'Profile' })
    expect(defineWebSite).toHaveBeenCalledWith(
      expect.objectContaining({ name: seo.name, url: seo.url }),
    )
    expect(useSchemaOrg).toHaveBeenCalledWith([
      { type: 'organization', options: expect.any(Object) },
      { type: 'webPage', options: { name: 'Profile' } },
      { type: 'webSite', options: expect.any(Object) },
    ])
  })

  it('falls back to the app name for the webpage schema without a title', async () => {
    await mountProbe()

    expect(defineWebPage).toHaveBeenCalledWith({ name: 'DnD Tracker' })
  })
})
