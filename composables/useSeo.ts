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
  })

  useSeoMeta({ ogUrl: seo.url })

  defineOgImageComponent('NuxtSeo', {
    title: title || 'DnD Tracker',
    siteLogo: '/logo.png',
    colorMode: 'dark',
    theme: '#7333E0',
  })
}
