import seo from '~/constants/seo'

export function useSeo(title?: string): void {
  const { locale, availableLocales } = useI18n({ useScope: 'global' })

  useHead({
    ...(title ? { title } : {}),
    titleTemplate: (title?: string) => {
      const isHome = availableLocales.includes(title?.toLowerCase() as any)
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
  })

  useSeoMeta({
    ogUrl: seo.url,
    ogImage: seo.socials,
    twitterImage: seo.socials,
    twitterTitle: seo.title,
    twitterDescription: seo.description,
    keywords: seo.keywords,
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
        'email': seo.email,
      },
      sameAs: [
        'https://www.instagram.com/dnd.tracker/',
      ],
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
