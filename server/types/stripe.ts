export type BillingProfile = Pick<
  ProfileRow,
  'id' | 'subscriptionType' | 'billingInterval' | 'stripeSubscriptionId'
>
