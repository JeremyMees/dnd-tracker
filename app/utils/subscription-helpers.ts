export function isPro(profile: ProfileRow): boolean {
  return profile.subscriptionType === 'pro'
}

const SUBSCRIPTION_LIMITS = {
  pro: { encounter: 250, campaign: 25, team: 15 },
  free: { encounter: 10, campaign: 3, team: 1 },
} satisfies Record<
  SubscriptionType,
  Record<'encounter' | 'campaign' | 'team', number>
>

export function getMax(
  type: 'encounter' | 'campaign' | 'team',
  subscription: SubscriptionType,
): number {
  return SUBSCRIPTION_LIMITS[subscription][type]
}
