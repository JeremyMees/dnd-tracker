import seo from './constants/seo'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@formkit/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/seo',
  ],

  components: {
    dirs: [
      { path: '~/components/ui/', pathPrefix: false },
      '~/components',
    ],
  },

  routeRules: {
    '/no-access': { robots: false },
    '/reset-password': { robots: false },
    '/subscribe-success': { robots: false },
  },

  runtimeConfig: {
    public: { formkit: process.env.FORMKIT_PRO },
  },

  site: {
    url: seo.url,
    name: seo.name,
    description: seo.description,
  },

  ogImage: {
    enabled: true,
    defaults: { alt: seo.name },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: seo.name,
      url: seo.url,
      logo: seo.logo,
    },
  },

  image: {
    quality: 90,
    provider: 'imagekit',
    imagekit: { baseURL: 'https://ik.imagekit.io/c2es1qasw' },
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/',
      include: ['/campaigns/*', '/encounters/*', '/no-member', '/profile', '/subscribe-success'],
      cookieRedirect: true,
    },
  },

  i18n: {
    defaultLocale: 'nl',
    locales: [
      { code: 'nl', language: 'nl-BE', name: 'Nederlands', icon: '🇧🇪' },
      { code: 'en', language: 'en-US', name: 'English', icon: '🇬🇧' },
    ],
  },

  eslint: { config: { stylistic: true } },

  imports: { dirs: ['types/*.ts'] },

  formkit: { configFile: './formkit/config.ts' },

  devtools: { enabled: true },

  vite: {
    optimizeDeps: { force: true },
  },
})
