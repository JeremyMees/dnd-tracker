export type StripeSubscriptionType = 'medior' | 'pro' | 'free' | 'upgrade to pro'

export type StripeFields
  = | 'subscriptionType'
    | 'tempSubscription'
    | 'stripeSessionId'
    | 'stripeId'

export interface Stripe {
  subscriptionType: StripeSubscriptionType
  tempSubscription: StripeSubscriptionType
  stripeSessionId?: string
  stripeId?: string
}

export interface StripeProduct {
  name: string
  price: number
  id: string
}

export interface ProductPricing {
  type: StripeSubscriptionType
  title: string
  description: string
  price?: number
  id?: string
  isPopular: boolean
  items: {
    icon: string
    label?: string
    number?: number
  }[]
}
