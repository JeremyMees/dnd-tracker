import seo from '~~/constants/seo'

export function useSeo(title?: string): void {
  const { locale, availableLocales } = useI18n({ useScope: 'global' })

  useHead({
    ...(title ? { title } : {}),
    titleTemplate: (title?: string) => {
      const lowered = title?.toLowerCase()
      const isHome = availableLocales.some(locale => locale === lowered)
      return title && !isHome ? `${title} | ${seo.name}` : seo.name
    },
    htmlAttrs: {
      lang: locale.value,
    },
    link: [
      {
        rel: 'icon',
        type: 'image/ico',
        href: '/favicon.ico',
      },
    ],
    meta: [
      {
        name: 'keywords',
        content: seo.keywords,
      },
    ],
  })

  useSeoMeta({
    ogImage: seo.socials,
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
      name: title || 'DnD Tracker',
    }),
    defineWebSite({
      name: seo.name,
      url: seo.url,
      description: seo.description,
    }),
  ])
}
