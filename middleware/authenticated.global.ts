export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const localePath = useLocalePath()
  const authenticationNeeded = to.meta.auth

  if (authenticationNeeded && !user.value) {
    return navigateTo(localePath('/login'))
  }
})
