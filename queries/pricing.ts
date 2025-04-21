import { useQuery } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export function usePricingListing() {
  const { toast } = useToast()
  const { t } = useI18n()

  const productDefaults: ProductPricing[] = [
    {
      type: 'free',
      title: 'Starter',
      description: t('pages.pricing.starter'),
      price: 0,
      isPopular: false,
      items: [
        { label: 'pages.pricing.update', icon: 'check' },
        { number: 10, label: 'general.encounter', icon: 'check' },
        { number: 3, label: 'general.campaign', icon: 'check' },
        { label: 'pages.pricing.multiple', icon: 'x' },
        { label: 'pages.pricing.live', icon: 'x' },
      ],
    },
    {
      type: 'medior',
      title: 'Medior',
      description: t('pages.pricing.medior'),
      isPopular: true,
      items: [
        { label: 'pages.pricing.update', icon: 'check' },
        { number: 50, label: 'general.encounter', icon: 'check' },
        { number: 10, label: 'general.campaign', icon: 'check' },
        { label: 'pages.pricing.multiple', icon: 'x' },
        { label: 'pages.pricing.live', icon: 'x' },
      ],
    },
    {
      type: 'pro',
      title: 'Pro',
      description: t('pages.pricing.pro'),
      isPopular: false,
      items: [
        { label: 'pages.pricing.update', icon: 'check' },
        { number: 250, label: 'general.encounter', icon: 'check' },
        { number: 25, label: 'general.campaign', icon: 'check' },
        { label: 'pages.pricing.multiple', icon: 'check' },
        { label: 'pages.pricing.live', icon: 'check' },
      ],
    },
    {
      type: 'upgrade to pro',
      title: 'Upgrade to Pro',
      description: t('pages.pricing.pro'),
      isPopular: false,
      items: [
        { label: 'pages.pricing.update', icon: 'check' },
        { number: 250, label: 'general.encounter', icon: 'check' },
        { number: 25, label: 'general.campaign', icon: 'check' },
        { label: 'pages.pricing.multiple', icon: 'check' },
        { label: 'pages.pricing.live', icon: 'check' },
      ],
    },
  ]

  return useQuery({
    queryKey: ['usePricingListing'],
    queryFn: async () => {
      try {
        const response = await $fetch<StripeProduct[]>('/api/stripe/products')
        const products = [...productDefaults]

        response.forEach((product) => {
          const { name, price, id } = product
          const index = products.findIndex(p => p.type === name.toLowerCase())

          if (index >= 0) products[index] = { ...products[index], price, id }
        })

        return products
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
    initialData: () => productDefaults,
  })
}
