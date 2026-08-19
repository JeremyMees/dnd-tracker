export type StripeFields =
  | 'subscriptionType'
  | 'stripeSessionId'
  | 'stripeId'
  | 'stripeSubscriptionId'
  | 'billingInterval'
  | 'subscriptionStatus'
  | 'subscriptionPeriodEnd'

export interface StripePrice {
  id: string
  lookupKey: string
  price: number
  interval: BillingInterval
}
