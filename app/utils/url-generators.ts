export function generateParams<T extends object>(data: T): string {
  return Object.keys(data)
    .map(key => `${key}=${data[key as keyof T]}`)
    .join('&')
}

export function slugify(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/-+$/g, '')
}

export function campaignUrl(
  campaign: Record<string, any> & { id: number, title: string },
  type: 'encounters' | 'homebrews' | 'notes' | 'settings' | 'danger-zone',
): string {
  const title: string = slugify(campaign.title)

  return `/campaigns/${campaign.id}${title === '' ? '-campaign' : `-${title}`}/${type}`
}

export function encounterUrl(encounter: InitiativeRow | EncounterItem): string {
  const title: string = slugify(encounter.title)

  return `/encounters/${encounter.id}${title === '' ? '-encounter' : `-${title}`}`
}

function localeParam(locale: string): string {
  return locale === 'nl' ? '' : `${locale}/`
}

export function shareEncounterUrl(token: string, locale: string): string {
  const { appDomain } = useRuntimeConfig().public

  return `${appDomain}/${localeParam(locale)}playground?token=${token}`
}
