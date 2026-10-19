import { setUser } from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
  const { user } = useAuthentication()
  const consent = useHasConsent()
  const allowed = computed(() => consent.value.includes('measurement'))

  watch(
    [user, allowed],
    ([current, isAllowed]) => {
      setUser(
        current && isAllowed
          ? { id: current.id, email: current.email, username: current.username }
          : null,
      )
    },
    { immediate: true },
  )
})
