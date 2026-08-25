import { useQuery } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

const proItems: ProductPricingItem[] = [
  { label: 'pages.pricing.update', icon: 'check' },
  { number: 250, label: 'general.encounter', icon: 'check' },
  { number: 25, label: 'general.campaign', icon: 'check' },
  { label: 'pages.pricing.multiple', icon: 'check' },
  { label: 'pages.pricing.live', icon: 'check' },
]

const productDefaults: ProductPricing[] = [
  {
    key: 'free',
    tier: 'free',
    interval: null,
    title: 'Starter',
    description: 'pages.pricing.starter',
    price: 0,
    items: [
      { label: 'pages.pricing.update', icon: 'check' },
      { number: 10, label: 'general.encounter', icon: 'check' },
      { number: 3, label: 'general.campaign', icon: 'check' },
      { label: 'pages.pricing.multiple', icon: 'x' },
      { label: 'pages.pricing.live', icon: 'x' },
    ],
  },
  {
    key: 'pro_monthly',
    tier: 'pro',
    interval: 'month',
    title: 'Pro',
    description: 'pages.pricing.pro',
    items: proItems,
  },
  {
    key: 'pro_lifetime',
    tier: 'pro',
    interval: 'lifetime',
    title: 'Pro',
    description: 'pages.pricing.pro',
    items: proItems,
  },
]

export function usePricingListing() {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['usePricingListing'],
    queryFn: async () => {
      try {
        const response = await $fetch<StripePrice[]>('/api/stripe/products')
        const products = [...productDefaults]

        response.forEach(({ lookupKey, price, id }) => {
          const index = products.findIndex(p => p.key === lookupKey)

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

        throw error
      }
    },
    placeholderData: () => productDefaults,
    retry: false,
  })
}
