import type { RouteLocationNamedI18n } from 'vue-router'

export function generateParams<T extends object>(data: T): string {
  const params = new URLSearchParams()

  Object.keys(data).forEach(key => {
    const value = data[key as keyof T]

    if (value === undefined || value === null) {
      return
    } else if (Array.isArray(value)) {
      value.forEach(v => params.append(key, String(v)))
    } else {
      params.append(key, String(value))
    }
  })

  return params.toString()
}

export function slugify(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/-+$/g, '')
}

type CampaignPage =
  'encounters' | 'homebrews' | 'notes' | 'settings' | 'danger-zone'

export function campaignUrl(
  campaign: { id: number; title: string },
  type: CampaignPage,
): RouteLocationNamedI18n<`campaigns-id-title-${CampaignPage}`> {
  const title: string = slugify(campaign.title)

  return {
    name: `campaigns-id-title-${type}`,
    params: {
      id: String(campaign.id),
      title: title === '' ? 'campaign' : title,
    },
  }
}

export function encounterUrl(encounter: {
  id: number
  title: string
}): RouteLocationNamedI18n<'encounters-id-title'> {
  const title: string = slugify(encounter.title)

  return {
    name: 'encounters-id-title',
    params: {
      id: String(encounter.id),
      title: title === '' ? 'encounter' : title,
    },
  }
}

export function shareEncounterUrl(token: string, locale: string): string {
  const { appDomain } = useRuntimeConfig().public

  return `${appDomain}${localeParam(locale)}/playground?token=${token}`
}

export function liveSessionUrl(code: string, locale: string): string {
  const { appDomain } = useRuntimeConfig().public

  return `${appDomain}${localeParam(locale)}/live?code=${code}`
}
