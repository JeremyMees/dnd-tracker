// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/image',
  ],
  eslint: {
    config: { stylistic: true },
  },
  imports: { dirs: ['types/*.ts'] },
  image: {
    quality: 90,
    provider: 'imagekit',
    imagekit: { baseURL: 'https://ik.imagekit.io/c2es1qasw' },
  },
})
