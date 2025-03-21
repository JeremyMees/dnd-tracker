import vue from '@vitejs/plugin-vue'
import seo from './constants/seo'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@formkit/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@unlok-co/nuxt-stripe',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    'nuxt-authorization',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/ui', prefix: 'Ui' },
    { path: '~/components/modal', prefix: 'Modal' },
    { path: '~/components/form', prefix: 'Form' },
    { path: '~/components/initiative', prefix: 'Initiative' },
    { path: '~/components/skeleton', prefix: 'Skeleton' },
    { path: '~/components/animation', prefix: 'Animation' },
  ],

  imports: { dirs: ['types/*.ts', 'queries/*.ts', 'shared/utils/*.ts'] },

  devtools: { enabled: true },

  css: ['@/assets/css/tippy.css'],

  site: {
    url: seo.url,
    name: seo.name,
    description: seo.description,
  },

  colorMode: { fallback: 'dark' },

  runtimeConfig: {
    stripeWebhook: process.env.STRIPE_WEBHOOK,
    plunkApiKey: process.env.PLUNK_API_KEY,
    public: {
      formkit: process.env.FORMKIT_PRO,
      appDomain: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

  routeRules: {
    '/no-access': { robots: false },
    '/reset-password': { robots: false },
    '/subscribe-success': { robots: false },
    '/campaigns/join': { robots: false },
  },
  compatibilityDate: '2024-04-03',

  nitro: {
    rollupConfig: {
      // @ts-expect-error need this to render email templates
      plugins: [vue()],
    },
  },

  vite: {
    optimizeDeps: { force: true },
  },

  eslint: { config: { stylistic: true } },

  formkit: { configFile: './formkit/config.ts' },

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

  image: {
    quality: 90,
    provider: 'imagekit',
    imagekit: { baseURL: 'https://ik.imagekit.io/c2es1qasw' },
  },

  ogImage: {
    defaults: { alt: seo.name },
  },

  shadcn: { prefix: 'ui' },

  stripe: {
    server: { key: process.env.STRIPE_SK },
    client: { key: process.env.STRIPE_PK },
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/',
      include: ['/campaigns/*', '/encounters/*', '/no-member', '/profile', '/subscribe-success'],
      saveRedirectToCookie: true,
    },
  },
})