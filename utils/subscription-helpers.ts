export function isPro(profile: ProfileRow): boolean {
  return profile.subscription_type === 'pro'
}

export function isMedior(profile: ProfileRow): boolean {
  return profile.subscription_type === 'pro' || profile.subscription_type === 'medior'
}

export function hasCorrectSubscription(
  subscription: StripeSubscriptionType,
  expected: StripeSubscriptionType,
): boolean {
  if (
    subscription === 'pro'
    || (subscription === expected)
    || (subscription === 'medior' && expected === 'free')
  ) return true
  else return false
}

export function getMax(
  type: 'encounter' | 'campaign' | 'team',
  subscription: StripeSubscriptionType,
): number {
  switch (subscription) {
    case 'medior':
      switch (type) {
        case 'encounter': return 50
        case 'campaign': return 10
        case 'team': return 3
      }
      break
    case 'pro':
      switch (type) {
        case 'encounter': return 250
        case 'campaign': return 25
        case 'team': return 15
      }
      break
    default:
      switch (type) {
        case 'encounter': return 10
        case 'campaign': return 3
        case 'team': return 1
      }
  }
}
