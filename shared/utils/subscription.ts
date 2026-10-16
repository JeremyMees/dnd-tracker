export function isProSubscription(
  subscription?: SubscriptionType | null,
): boolean {
  return subscription === 'pro'
}

export function canHaveCampaignMembers(
  ownerSubscription?: SubscriptionType | null,
): boolean {
  return isProSubscription(ownerSubscription)
}

export function isCampaignSuspendedFor(
  owner: CampaignOwner,
  userId: string,
): boolean {
  return owner.id !== userId && !canHaveCampaignMembers(owner.subscriptionType)
}
