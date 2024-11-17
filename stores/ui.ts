export const useUI = defineStore('useUI', () => {
  const auth = useAuth()
  const route = useRoute()

  const showNavigation = ref<boolean>(true)

  const routes = computed<Route[]>(() => {
    return [
      { label: 'components.navbar.contact', url: 'contact', requireAuth: false },
      { label: 'components.navbar.pricing', url: 'pricing', requireAuth: false },
      ...auth.isAuthenticated
        ? []
        : [
            { label: 'components.navbar.login', url: 'login', requireAuth: true },
            { label: 'components.navbar.register', url: 'register', requireAuth: true },
          ],

    ]
  })

  const playRoutes = computed<Route[]>(() => {
    return [
      ...auth.isAuthenticated
        ? [
            { label: 'components.navbar.campaigns', url: 'campaigns', requireAuth: true },
            { label: 'components.navbar.encounters', url: 'encounters', requireAuth: true },
          ]
        : [],
      { label: 'components.navbar.playground', url: 'playground', requireAuth: false },
      { label: 'components.navbar.fantasy', url: 'fantasy-name-generator', requireAuth: false },
      { label: 'components.navbar.info', url: 'info', requireAuth: false },
    ]
  })

  const profileRoutes = ref<Route[]>([
    { label: 'components.navbar.profile', url: 'profile', requireAuth: true },
  ])

  const bgColor = computed<'primary' | 'secondary' | undefined>(() => {
    if (!route.name || typeof route.name !== 'string') return

    const page = route.name.split('___')[0]

    if (['profile', 'info', 'pricing'].includes(page)) return 'primary'
    else if (['updates-changelog', 'updates-feature-request'].includes(page)) return 'secondary'
  })

  return {
    showNavigation,
    routes,
    playRoutes,
    profileRoutes,
    bgColor,
  }
})
