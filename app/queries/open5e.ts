import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'
import { TEN_MINUTES, ONE_DAY } from '~~/constants/time'

const urlMap = new Map<Open5eType, string>([
  ['monsters', 'https://api.open5e.com/v2/creatures'],
  ['spells', 'https://api.open5e.com/v2/spells'],
  ['conditions', 'https://api.open5e.com/v2/conditions'],
  ['magicitems', 'https://api.open5e.com/v2/magicitems'],
  ['weapons', 'https://api.open5e.com/v2/weapons'],
  ['armor', 'https://api.open5e.com/v2/armor'],
])

const excludeMap = new Map<Open5eType, string>([
  [
    'monsters',
    'document,speed,saving_throws,skill_bonuses,subcategory,creaturesets,environments,illustration',
  ],
  ['spells', 'document'],
  ['conditions', 'document'],
  ['magicitems', 'document'],
  ['weapons', 'document'],
  ['armor', 'document'],
])

export function useOpen5eListing(
  data: ComputedRef<{ type: Open5eType; filters: Open5eFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5e', data],
    queryFn: async () => {
      try {
        const query = generateParams({
          ...data.value.filters,
          limit: 20,
          page: data.value.filters.page + 1, // Open5e uses 1-based indexing
          exclude: excludeMap.get(data.value.type),
        })

        return await $fetch<Open5eResponse<Open5eItem>>(
          `${urlMap.get(data.value.type)}/?${query}`,
        )
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })

        throw error
      }
    },
    select: (response): Open5eListingResult | undefined => {
      if (!response) return

      const type = data.value.type
      const items = response.results.map(item =>
        transformOpen5eItem(type, item),
      )

      return narrowListing(type, items, Math.ceil(response.count / 20))
    },
    staleTime: TEN_MINUTES,
    gcTime: TEN_MINUTES,
    retry: false,
  })
}

export function useOpen5eDocuments() {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5eDocuments'],
    queryFn: async () => {
      try {
        const query = generateParams({
          page: 1,
          ordering: '-publication_date',
        })

        const { results } = await $fetch<Open5eResponse<Open5eDocument>>(
          `https://api.open5e.com/v2/documents/?${query}`,
        )

        return results.filter(doc =>
          ['5e-2014', '5e-2024'].includes(doc.gamesystem.key),
        )
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })

        throw error
      }
    },
    placeholderData: keepPreviousData,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
    retry: false,
  })
}

export async function prefetchConditionsListing() {
  const queryClient = useQueryClient()

  return queryClient
    .query({
      queryKey: ['useConditionsListing'],
      queryFn: async () => {
        const query = generateParams({
          page: 1,
          document__key__in: 'core',
          exclude: excludeMap.get('conditions'),
        })

        const { results } = await $fetch<Open5eResponse<Open5eCondition>>(
          `https://api.open5e.com/v2/conditions/?${query}`,
        )
        return results.map(c => toCondition(c, ['srd-2024']))
      },
      staleTime: ONE_DAY,
      gcTime: ONE_DAY,
    })
    .catch(() => undefined)
}

export function useConditionsListing() {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useConditionsListing'],
    queryFn: async () => {
      try {
        const query = generateParams({
          page: 1,
          document__key__in: 'core',
          exclude: excludeMap.get('conditions'),
        })

        const { results } = await $fetch<Open5eResponse<Open5eCondition>>(
          `https://api.open5e.com/v2/conditions/?${query}`,
        )

        return results.map(c => toCondition(c, ['srd-2024']))
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })

        throw error
      }
    },
    staleTime: ONE_DAY,
    gcTime: ONE_DAY,
    retry: false,
  })
}

export function useOpen5eMonsterListing(
  data: ComputedRef<{ filters: Open5eFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5eMonsterListing', data],
    queryFn: async () => {
      try {
        const { page, cr, ...filters } = data.value.filters

        const query = generateParams({
          ...filters,
          ...(cr
            ? {
                challenge_rating__gte: cr,
                challenge_rating__lte: cr,
              }
            : {}),
          limit: 20,
          page: page + 1, // Open5e uses 1-based indexing
          exclude: excludeMap.get('monsters'),
        })

        return await $fetch<Open5eResponse<Open5eMonster>>(
          `${urlMap.get('monsters')}/?${query}`,
        )
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })

        throw error
      }
    },
    select: (response): { items: DndMonster[]; pages: number } | undefined => {
      if (response) {
        return {
          items: response.results.map(toMonster),
          pages: Math.ceil(response.count / 20),
        }
      }
    },
    staleTime: TEN_MINUTES,
    gcTime: TEN_MINUTES,
    retry: false,
  })
}
