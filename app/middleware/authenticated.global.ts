export default defineNuxtRouteMiddleware(async to => {
  const user = useSupabaseUser()
  const localePath = useLocalePath()
  const authenticationNeeded = to.meta.auth

  if (!authenticationNeeded) return

  if (!user.value) {
    return navigateTo(localePath('login'))
  }

  const { user: profile, fetch } = useAuthentication()

  if (!profile.value) await fetch()

  if (!profile.value) {
    return navigateTo(localePath('login'))
  }
})
