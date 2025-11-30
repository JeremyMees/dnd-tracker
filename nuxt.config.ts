import vue from '@vitejs/plugin-vue'
import seo from './constants/seo'
import packageJSON from './package.json'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/supabase',
    '@nuxt/image',
    'nuxt-zod-i18n',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@unlok-co/nuxt-stripe',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    'nuxt-authorization',
    'motion-v/nuxt',
    '@nuxt/test-utils/module',
    '@sentry/nuxt/module',
    '@formkit/auto-animate/nuxt',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/modal', prefix: 'Modal' },
    { path: '~/components/form', prefix: 'Form' },
    { path: '~/components/initiative', prefix: 'Initiative' },
    { path: '~/components/skeleton', prefix: 'Skeleton' },
    { path: '~/components/animation', prefix: 'Animation' },
  ],

  imports: { dirs: ['@@/types/*.ts', 'types/*.ts'] },

  devtools: { enabled: true },

  css: [
    '~/assets/css/global.css',
    '~/assets/css/tippy.css',
    '~/assets/css/driver.css',
  ],

  site: {
    url: seo.url,
    name: seo.name,
    description: seo.description,
  },

  colorMode: { fallback: 'dark' },

  runtimeConfig: {
    stripeWebhook: process.env.STRIPE_WEBHOOK,
    plunkApiKey: process.env.PLUNK_API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    trmnl: process.env.TRMNL,
    public: {
      appDomain: process.env.NUXT_PUBLIC_SITE_URL,
      appVersion: packageJSON.version,
      maintenanceMode: process.env.NUXT_PUBLIC_MAINTENANCE_MODE,
      sentry: {
        dsn: process.env.SENTRY_DSN,
      },
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/contact': { prerender: true },
    '/policies/**': { prerender: true },
    '/no-access': { robots: false },
    '/reset-password': { robots: false },
    '/subscribe-success': { robots: false },
    '/campaigns/join': { robots: false },
    '/style-guide': { robots: false },
    '/maintenance': { robots: false },
  },

  sourcemap: {
    client: 'hidden',
  },

  compatibilityDate: '2024-04-03',

  nitro: {
    rollupConfig: {
      plugins: [vue()],
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  eslint: { config: { stylistic: true } },

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

  ogImage: { enabled: false },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'kees',
      project: 'dnd-tracker',
    },

    autoInjectServerSentry: 'top-level-import',
  },

  shadcn: {
    prefix: 'ui',
    componentDir: '~/components/ui',
  },

  stripe: {
    server: { key: process.env.STRIPE_SK },
    client: { key: process.env.STRIPE_PK },
  },

  supabase: {
    types: '~~/shared/types/database-generated.ts',
    redirectOptions: {
      login: '/login',
      callback: '/',
      include: ['/campaigns/*', '/encounters/*', '/no-member', '/profile', '/subscribe-success'],
      saveRedirectToCookie: true,
    },
  },

  zodI18n: {
    localeCodesMapping: {
      'en-GB': 'en',
      'nl-NL': 'nl',
    },
  },
})
