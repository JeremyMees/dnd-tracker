export type StripeFields =
  | 'subscriptionType'
  | 'stripeSessionId'
  | 'stripeId'
  | 'stripeSubscriptionId'
  | 'billingInterval'
  | 'subscriptionStatus'
  | 'subscriptionPeriodEnd'
  | 'cancelAtPeriodEnd'

export interface StripePrice {
  id: string
  lookupKey: string
  price: number
  interval: BillingInterval
}

export type ProductPricingKey = 'free' | 'pro_monthly' | 'pro_lifetime'

export interface ProductPricingItem {
  icon?: 'check' | 'x'
  label?: string
  number?: number
}

export interface ProductPricing {
  key: ProductPricingKey
  tier: SubscriptionType
  interval: BillingInterval | null
  title: string
  description: string
  price?: number
  id?: string
  items: ProductPricingItem[]
}
