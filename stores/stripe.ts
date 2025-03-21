export const useStripe = defineStore('useStripe', () => {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const user = useAuthenticatedUser()

  const loading = ref<boolean>(true)
  const products = ref<ProductPricing[]>([
    {
      type: 'free',
      title: 'Starter',
      description: t('pages.pricing.starter'),
      price: 0,
      items: [
        { number: 10, icon: 'check' },
        { number: 3, icon: 'check' },
        { icon: 'cross' },
        { icon: 'cross' },
        { icon: 'check' },
      ],
    },
    {
      type: 'medior',
      title: 'Medior',
      description: t('pages.pricing.medior'),
      items: [
        { number: 50, icon: 'check' },
        { number: 10, icon: 'check' },
        { icon: 'cross' },
        { icon: 'check' },
        { icon: 'check' },
      ],
    },
    {
      type: 'pro',
      title: 'Pro',
      description: t('pages.pricing.pro'),
      items: [
        { number: 250, icon: 'check' },
        { number: 25, icon: 'check' },
        { icon: 'check' },
        { icon: 'check' },
        { icon: 'check' },
      ],
    },
    {
      type: 'upgrade to pro',
      title: 'Upgrade to Pro',
      description: t('pages.pricing.pro'),
      items: [
        { number: 250, icon: 'check' },
        { number: 25, icon: 'check' },
        { icon: 'check' },
        { icon: 'check' },
        { icon: 'check' },
      ],
    },
  ])

  const shownProduct = computed<ProductPricing[]>(() => {
    if (user.value.subscription_type === 'medior') {
      return products.value.filter(p => p.type !== 'pro')
    }
    else {
      return products.value.filter(p => p.type !== 'upgrade to pro')
    }
  })

  async function fetchProducts(): Promise<void> {
    const stripeProducts = await $fetch('/api/stripe/products')

    stripeProducts.forEach((product) => {
      const { name, price, id } = product
      const index = products.value.findIndex(product => product.type === name.toLowerCase())

      if (index >= 0) {
        products.value[index] = { ...products.value[index], price, id }
      }
    })

    loading.value = false
  }

  async function subscribe(lookup: string, locale: string, type: StripeSubscriptionType): Promise<void> {
    if (!user.value) {
      navigateTo(localePath('/login'))
    }

    const { data } = await useFetch('/api/stripe/subscribe', {
      method: 'POST',
      body: {
        user: user.value,
        lookup,
        locale,
        type,
        ...(user.value.stripe_id && { customer: user.value.stripe_id }),
      },
    })

    if (data.value) {
      navigateTo(data.value.url, { external: true })
    }
  }

  function isCurrent(type: StripeSubscriptionType): boolean {
    if (!user.value) {
      return false
    }

    const current = user.value.subscription_type || 'free'

    return type === current
  }

  function isUpgradeable(type: StripeSubscriptionType): boolean {
    const current = user.value.subscription_type || 'free'

    if (current === 'free') {
      return true
    }

    return type === 'upgrade to pro' && current === 'medior'
  }

  onMounted(async () => {
    await fetchProducts()
  })

  return {
    products,
    shownProduct,
    loading,
    subscribe,
    fetchProducts,
    isCurrent,
    isUpgradeable,
    labels: [
      'general.encounter',
      'general.campaign',
      'pages.pricing.multiple',
      'pages.pricing.live',
      'pages.pricing.update',
    ],
  }
})
