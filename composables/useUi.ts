export function useUi() {
  const { user } = useAuthentication()

  const routes = [
    {
      label: 'components.navbar.contact',
      url: '/contact',
      requireAuth: false,
      icon: 'tabler:mail',
    },
    {
      label: 'components.navbar.pricing',
      url: '/pricing',
      requireAuth: false,
      icon: 'tabler:credit-card',
    },
    ...user.value
      ? []
      : [
          {
            label: 'components.navbar.login',
            url: '/login',
            requireAuth: true,
            icon: 'tabler:login',
          },
          {
            label: 'components.navbar.register',
            url: '/register',
            requireAuth: true,
            icon: 'tabler:user-plus',
          },
        ],

  ]

  const playRoutes = [
    ...user.value
      ? [
          {
            label: 'components.navbar.campaigns',
            url: '/campaigns',
            requireAuth: true,
            icon: 'tabler:layout-dashboard',
          },
          {
            label: 'components.navbar.encounters',
            url: '/encounters',
            requireAuth: true,
            icon: 'tabler:list-details',
          },
        ]
      : [],
    {
      label: 'components.navbar.playground',
      url: '/playground',
      requireAuth: false,
      icon: 'tabler:monkeybar',
    },
    {
      label: 'components.navbar.fantasy',
      url: '/fantasy-name-generator',
      requireAuth: false,
      icon: 'tabler:signature',
    },
    {
      label: 'components.navbar.dnd-content',
      url: '/dnd-content',
      requireAuth: false,
      icon: 'tabler:book',
    },
  ]

  const profileRoutes = [
    {
      label: 'components.navbar.profile',
      url: '/profile',
      requireAuth: true,
      icon: 'tabler:user',
    },
    {
      label: 'components.navbar.changelog',
      url: '/updates/changelog',
      requireAuth: false,
      icon: 'tabler:history',
    },
    {
      label: 'components.navbar.featureRequest',
      url: '/updates/feature-request',
      requireAuth: false,
      icon: 'tabler:bulb',
    },
    ...user.value?.subscription_type !== 'pro'
      ? []
      : [
          {
            label: 'components.navbar.upgrade',
            url: '/pricing',
            requireAuth: true,
            icon: 'tabler:sparkles',
          },
        ],
  ]

  return {
    routes,
    playRoutes,
    profileRoutes,
  }
}
