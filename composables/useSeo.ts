import seo from '~/constants/seo'

export function useSeo(title?: string): void {
  const { locale } = useI18n({ useScope: 'global' })

  useHead({
    ...(title ? { title } : {}),
    htmlAttrs: {
      lang: locale.value,
    },
    meta: [
      { name: 'keywords', content: seo.keywords },
    ],
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
  })

  defineOgImageComponent('NuxtSeo', {
    title: title || 'DnD Tracker',
    description: seo.description,
    siteLogo: '/logo.png',
    colorMode: 'dark',
    theme: '#7333E0',
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
