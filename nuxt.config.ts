import vue from '@vitejs/plugin-vue'
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
    '@unlok-co/nuxt-stripe',
    '@nuxt/content',
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
    stripeWebhook: process.env.STRIPE_WEBHOOK,
    plunkApiKey: process.env.PLUNK_API_KEY,
    public: {
      formkit: process.env.FORMKIT_PRO,
      appDomain: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

  stripe: {
    server: { key: process.env.STRIPE_SK },
    client: { key: process.env.STRIPE_PK },
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
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
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

  nitro: {
    rollupConfig: {
      plugins: [vue()],
    },
  },
})
