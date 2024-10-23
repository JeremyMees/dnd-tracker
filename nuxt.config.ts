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
  ],
  components: {
    dirs: [
      { path: '~/components/ui/', pathPrefix: false },
      '~/components',
    ],
  },
  runtimeConfig: {
    public: { formkit: process.env.FORMKIT_PRO },
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
