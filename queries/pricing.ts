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
