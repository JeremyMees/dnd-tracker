export function isPro(profile: ProfileRow): boolean {
  return profile.subscriptionType === 'pro'
}

export function getMax(
  type: 'encounter' | 'campaign' | 'team',
  subscription: SubscriptionType,
): number {
  switch (subscription) {
    case 'pro':
      switch (type) {
        case 'encounter':
          return 250
        case 'campaign':
          return 25
        case 'team':
          return 15
      }
      break
    default:
      switch (type) {
        case 'encounter':
          return 10
        case 'campaign':
          return 3
        case 'team':
          return 1
      }
  }
}
