export { createError } from 'h3'
export { defineAbility } from 'nuxt-authorization/utils'

export function useRuntimeConfig() {
  return { public: {} }
}

export function useI18n() {
  return { locale: { value: 'en' } }
}

export function useSupabaseClient(): never {
  throw new Error('useSupabaseClient is not mocked in this test')
}
