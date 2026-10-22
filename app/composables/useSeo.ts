import seo from '~~/constants/seo'

export function useSeo(title?: MaybeRefOrGetter<string | undefined>): void {
  const { locale, availableLocales } = useI18n({ useScope: 'global' })
  const localeCodes = new Set<string>(availableLocales)
  const pageTitle = computed(() => toValue(title))
  const localeHead = useLocaleHead({ seo: true })
  const toSiteUrl = createSitePathResolver({ absolute: true, withBase: true })
  const alternates = computed(() =>
    (localeHead.value.link ?? [])
      .filter(link => link.rel === 'alternate' && link.href)
      .map(link => ({ ...link, href: toSiteUrl(link.href!).value })),
  )

  useHead({
    ...(title ? { title: pageTitle } : {}),
    titleTemplate: (title?: string) => {
      if (!title || localeCodes.has(title.toLowerCase())) return seo.name

      return `${title} | ${seo.name}`
    },
    htmlAttrs: {
      lang: locale.value,
    },
    link: computed(() => [
      {
        rel: 'icon',
        type: 'image/ico',
        href: '/favicon.ico',
      },
      ...alternates.value,
    ]),
    meta: [
      {
        name: 'keywords',
        content: seo.keywords,
      },
    ],
  })

  useSeoMeta({
    ogImage: withSiteUrl(seo.socials),
    ogImageWidth: seo.socialsWidth,
    ogImageHeight: seo.socialsHeight,
  })

  useSchemaOrg([
    defineOrganization({
      name: seo.name,
      url: seo.url,
      logo: seo.logo,
      description: seo.description,
      email: seo.email,
      contactPoint: {
        '@type': 'ContactPoint',
        email: seo.email,
      },
      sameAs: ['https://www.instagram.com/dnd.tracker/'],
    }),
    defineWebPage({
      name: pageTitle.value || 'DnD Tracker',
    }),
    defineWebSite({
      name: seo.name,
      url: seo.url,
      description: seo.description,
    }),
  ])
}
