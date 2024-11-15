export function generateParams<T extends object>(data: T): string {
  return Object.keys(data)
    .map(key => `${key}=${data[key as keyof T]}`)
    .join('&')
}

export function campaignUrl(
  campaign: CampaignRow | CampaignItem,
  type: 'content' | 'settings' | 'danger-zone' | 'join',
): string {
  const title: string = campaign.title.replace(/[^a-zA-Z0-9]+/g, '-')

  return `/campaigns/${campaign.id}${title === '-' ? '-campaign' : `-${title}`}/${type}`
}
