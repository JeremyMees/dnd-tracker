import { setUser } from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
  const { user } = useAuthentication()

  watch(
    user,
    current => {
      setUser(
        current
          ? { id: current.id, email: current.email, username: current.username }
          : null,
      )
    },
    { immediate: true },
  )
})
