export default defineNuxtRouteMiddleware(to => {
  const localePath = useLocalePath()

  if (!isMaintenanceEnabled()) {
    if (to.path.includes('/maintenance')) return navigateTo(localePath('index'))
    else return
  }

  if (isUnderMaintenance(to.path, ['/maintenance']))
    return navigateTo(localePath('maintenance'))
})
