// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@formkit/nuxt',
  ],
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
      callback: '/login/confirm',
      exclude: ['/'],
    },
  },
  eslint: { config: { stylistic: true } },
  imports: { dirs: ['types/*.ts'] },
  formkit: { configFile: './formkit/config.ts' },
  devtools: { enabled: true },
})
