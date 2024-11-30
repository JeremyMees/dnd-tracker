export function generateParams<T extends object>(data: T): string {
  return Object.keys(data)
    .map(key => `${key}=${data[key as keyof T]}`)
    .join('&')
}

export function campaignUrl(
  campaign: CampaignRow | CampaignItem | CampaignFull,
  type: 'content' | 'settings' | 'danger-zone' | 'join',
): string {
  const title: string = campaign.title.replace(/[^a-zA-Z0-9]+/g, '-')

  return `/campaigns/${campaign.id}${title === '-' ? '-campaign' : `-${title}`}/${type}`
}

export function encounterUrl(encounter: InitiativeRow | EncounterItem): string {
  const title: string = encounter.title.replace(/[^a-zA-Z0-9]+/g, '-')

  return `/encounters/${encounter.id}${title === '-' ? '-encounter' : `-${title}`}`
}

function localeParam(locale: string): string {
  return locale === 'nl' ? '' : `${locale}/`
}

export function shareEncounterUrl(encounter: InitiativeRow | EncounterItem, locale: string): string {
  const { appDomain } = useRuntimeConfig().public
  const content = window.btoa(encodeURIComponent(encounter.id))

  return `${appDomain}/${localeParam(locale)}playground?content=${content}`
}
