import type { QueryKey } from '@tanstack/vue-query'
import type { LocationQuery } from 'vue-router'

type RouteToken = LocationQuery[string] | undefined

function scopedKey(name: string, ...params: unknown[]): QueryKey {
  const length = params.findLastIndex(param => param !== undefined) + 1

  return [name, ...params.slice(0, length)]
}

export const queryKeys = {
  campaignDetail: (id: number) => scopedKey('useCampaignDetail', id),
  campaignListing: (filters?: MaybeRef<SbFilter>) =>
    scopedKey('useCampaignListing', filters),
  campaignMinimal: (user?: string) => scopedKey('useCampaignMinimal', user),
  campaignCount: (user?: string) => scopedKey('useCampaignCount', user),
  campaignMember: (campaign: number) =>
    scopedKey('useCampaignMember', campaign),
  campaignMemberLookup: (email: string | undefined) =>
    scopedKey('useCampaignMemberLookup', { email }),
  joinCampaign: (token: RouteToken) => scopedKey('useJoinCampaign', token),
  encounterListing: (filters?: MaybeRef<SbFilter>, perPage?: number) =>
    scopedKey('useEncounterListing', filters, perPage),
  encounterCount: (user?: string) => scopedKey('useEncounterCount', user),
  initiativeSheetDetail: (id: number) =>
    scopedKey('useInitiativeSheetDetail', id),
  initiativeSheetPlayground: (token: RouteToken) =>
    scopedKey('useInitiativeSheetPlayground', token),
  combatEvents: (encounter: number) => scopedKey('useCombatEvents', encounter),
  homebrewListing: (filters?: MaybeRef<SbFilter>, perPage?: number) =>
    scopedKey('useHomebrewListing', filters, perPage),
  homebrewCount: (campaign?: number) => scopedKey('useHomebrewCount', campaign),
  noteListing: (filters?: MaybeRef<SbFilter>, perPage?: number) =>
    scopedKey('useNoteListing', filters, perPage),
  noteCount: (campaign?: number) => scopedKey('useNoteCount', campaign),
  featureListing: (filters?: MaybeRef<SbFilter>) =>
    scopedKey('useFeatureListing', filters),
  featureCount: () => scopedKey('useFeatureCount'),
  liveCode: (code: string) => scopedKey('useLiveCode', code),
  liveCodeError: (code: string) => scopedKey('useLiveCodeError', code),
  liveState: (token: string | undefined, seatToken: string | undefined) => [
    'useLiveState',
    token,
    seatToken,
  ],
  pricingListing: () => scopedKey('usePricingListing'),
  randomNames: (filters: MaybeRef<unknown>) =>
    scopedKey('useRandomNames', filters),
  srdListing: (data: MaybeRef<unknown>) => scopedKey('useSrdListing', data),
  srdMonsterListing: (data: MaybeRef<unknown>) =>
    scopedKey('useSrdMonsterListing', data),
  srdDocuments: () => scopedKey('useSrdDocuments'),
  conditionsListing: () => scopedKey('useConditionsListing'),
} satisfies Record<string, (...args: never[]) => QueryKey>
