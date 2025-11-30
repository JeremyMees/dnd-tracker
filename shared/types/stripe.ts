export type StripeSubscriptionType = 'medior' | 'pro' | 'free' | 'upgrade to pro'

export type StripeFields
  = | 'subscription_type'
    | 'temp_subscription'
    | 'stripe_session_id'
    | 'stripe_id'

export interface Stripe {
  subscription_type: StripeSubscriptionType
  temp_subscription: StripeSubscriptionType
  stripe_session_id?: string
  stripe_id?: string
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
