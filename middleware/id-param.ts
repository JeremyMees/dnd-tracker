export default defineNuxtRouteMiddleware(({ params }) => {
  const localePath = useLocalePath()

  if (!params.id || isNaN(+params.id)) {
    return navigateTo(localePath('/'))
  }
})
