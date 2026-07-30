export { createError } from 'h3'
export { defineAbility } from 'nuxt-authorization/utils'

export function useRuntimeConfig(): any {
  return { public: {} }
}

export function useI18n(): any {
  return { locale: { value: 'en' } }
}

export function useSupabaseClient(): any {
  throw new Error('useSupabaseClient is not mocked in this test')
}
