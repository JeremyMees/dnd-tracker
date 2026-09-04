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
  withSiteUrl,
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
  withSiteUrl: vi.fn((path: string) => `https://dnd-tracker.com${path}`),
}))

mockNuxtImport('useHead', () => useHead)
mockNuxtImport('useSeoMeta', () => useSeoMeta)
mockNuxtImport('useSchemaOrg', () => useSchemaOrg)
mockNuxtImport('defineOrganization', () => defineOrganization)
mockNuxtImport('defineWebPage', () => defineWebPage)
mockNuxtImport('defineWebSite', () => defineWebSite)
mockNuxtImport('withSiteUrl', () => withSiteUrl)

const locale = ref('en')
const availableLocales = ['en', 'nl']

mockNuxtImport('useI18n', () => () => ({
  locale,
  availableLocales,
}))

async function mountProbe(title?: MaybeRefOrGetter<string | undefined>) {
  const component = await mountSuspended(
    defineComponent({
      setup() {
        useSeo(title)

        return {}
      },
      template: '<div />',
    }),
  )

  await flushPromises()

  return component
}

function headTitle(call = 0): unknown {
  const options = useHead.mock.calls[call]![0] as { title?: unknown }

  return toValue(options.title)
}

describe('useSeo', () => {
  beforeEach(() => {
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

    expect(headTitle()).toBe('Profile')
    expect(useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        link: [{ rel: 'icon', type: 'image/ico', href: '/favicon.ico' }],
        meta: [{ name: 'keywords', content: seo.keywords }],
      }),
    )
  })

  it('tracks a reactive title so a renamed page updates the document title', async () => {
    const title = ref<string | undefined>('Sandbox')

    await mountProbe(() => title.value)

    expect(headTitle()).toBe('Sandbox')

    title.value = 'Renamed encounter'

    expect(headTitle()).toBe('Renamed encounter')
  })

  it('accepts a ref as the title', async () => {
    await mountProbe(ref('Profile'))

    expect(headTitle()).toBe('Profile')
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

  it('sets the open graph image with its dimensions from the seo constants', async () => {
    await mountProbe('Profile')

    expect(useSeoMeta).toHaveBeenCalledWith({
      ogImage: `${seo.url}${seo.socials}`,
      ogImageWidth: seo.socialsWidth,
      ogImageHeight: seo.socialsHeight,
    })
  })

  it('leaves og:url and the twitter card tags to the seo module defaults', async () => {
    await mountProbe('Profile')

    const options = useSeoMeta.mock.calls[0]![0] as Record<string, unknown>

    expect(Object.keys(options)).toEqual([
      'ogImage',
      'ogImageWidth',
      'ogImageHeight',
    ])
  })

  it('resolves the open graph image against the site url', async () => {
    await mountProbe('Profile')

    expect(withSiteUrl).toHaveBeenCalledWith(seo.socials)

    const { ogImage } = useSeoMeta.mock.calls[0]![0] as { ogImage: unknown }

    expect(ogImage).toBe(`${seo.url}${seo.socials}`)
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

  it('resolves a reactive title for the webpage schema', async () => {
    await mountProbe(() => 'Sandbox')

    expect(defineWebPage).toHaveBeenCalledWith({ name: 'Sandbox' })
  })
})
