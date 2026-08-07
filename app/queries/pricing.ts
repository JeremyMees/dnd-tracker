import { useQuery } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

const productDefaults: ProductPricing[] = [
  {
    type: 'free',
    title: 'Starter',
    description: 'pages.pricing.starter',
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
    description: 'pages.pricing.medior',
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
    description: 'pages.pricing.pro',
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
    description: 'pages.pricing.pro',
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

export function usePricingListing() {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['usePricingListing'],
    queryFn: async () => {
      try {
        const response = await $fetch<StripeProduct[]>('/api/stripe/products')
        const products = [...productDefaults]

        response.forEach(product => {
          const { name, price, id } = product
          const index = products.findIndex(p => p.type === name.toLowerCase())

          if (index >= 0 && products[index])
            products[index] = { ...products[index], price, id }
        })

        return products
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })
      }
    },
    placeholderData: () => productDefaults,
  })
}
