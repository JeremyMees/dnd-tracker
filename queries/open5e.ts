import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

const urlMap = new Map<Open5eType, string>([
  ['monsters', 'https://api.open5e.com/v2/creatures'],
  ['spells', 'https://api.open5e.com/v2/spells'],
  ['conditions', 'https://api.open5e.com/v2/conditions'],
  ['magicitems', 'https://api.open5e.com/v2/magicitems'],
  ['weapons', 'https://api.open5e.com/v2/weapons'],
  ['armor', 'https://api.open5e.com/v2/armor'],
])

const excludeMap = new Map<Open5eType, string>([
  ['monsters', 'document,speed,saving_throws,skill_bonuses,subcategory,creaturesets,environments,illustration'],
  ['spells', 'document'],
  ['conditions', 'document'],
  ['magicitems', 'document'],
  ['weapons', 'document'],
  ['armor', 'document'],
])

function transformOpen5eItem(type: Open5eType, item: Open5eItem): DndItem {
  switch (type) {
    case 'spells': return toSpell(item as Open5eSpell)
    case 'monsters': return toMonster(item as Open5eMonster)
    case 'conditions': return toCondition(item as Open5eCondition)
    case 'magicitems': return toMagicItem(item as Open5eMagicItem)
    case 'weapons': return toWeapon(item as Open5eWeapon)
    case 'armor': return toArmor(item as Open5eArmor)
    default: throw new Error(`Unsupported open5e type: ${type}`)
  }
}

function narrowListing(type: Open5eType, items: DndItem[], pages: number): Open5eListingResult {
  switch (type) {
    case 'spells': return { type, items: items.filter(isSpell), pages }
    case 'monsters': return { type, items: items.filter(isMonster), pages }
    case 'conditions': return { type, items: items.filter(isCondition), pages }
    case 'magicitems': return { type, items: items.filter(isMagicItem), pages }
    case 'weapons': return { type, items: items.filter(isWeapon), pages }
    case 'armor': return { type, items: items.filter(isArmor), pages }
    default: throw new Error(`Unsupported open5e type: ${type}`)
  }
}

export function useOpen5eListing(data: ComputedRef<{ type: Open5eType, filters: Open5eFilters }>) {
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

        return await $fetch<Open5eResponse<Open5eItem>>(`${urlMap.get(data.value.type)}/?${query}`)
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
    select: (response): Open5eListingResult | undefined => {
      if (!response) return

      const type = data.value.type
      const items = response.results.map(item => transformOpen5eItem(type, item))

      return narrowListing(type, items, Math.ceil(response.count / 20))
    },
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

        const { results } = await $fetch<Open5eResponse<Open5eDocument>>(`https://api.open5e.com/v2/documents/?${query}`)

        return results.filter(doc => ['5e-2014', '5e-2024'].includes(doc.gamesystem.key))
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
    placeholderData: keepPreviousData,
  })
}

export async function prefetchConditionsListing() {
  const queryClient = useQueryClient()

  return queryClient.prefetchQuery({
    queryKey: ['useConditionsListing'],
    queryFn: async () => {
      const query = generateParams({
        page: 1,
        document__key__in: 'core',
        exclude: excludeMap.get('conditions'),
      })

      const { results } = await $fetch<Open5eResponse<Open5eCondition>>(`https://api.open5e.com/v2/conditions/?${query}`)
      return results.map(c => toCondition(c, ['srd-2024']))
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
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

        const { results } = await $fetch<Open5eResponse<Open5eCondition>>(`https://api.open5e.com/v2/conditions/?${query}`)

        return results.map(c => toCondition(c, ['srd-2024']))
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
  })
}

export function useOpen5eMonsterListing(data: ComputedRef<{ filters: Open5eFilters }>) {
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

        return await $fetch<Open5eResponse<Open5eMonster>>(`${urlMap.get('monsters')}/?${query}`)
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
    select: (response): { items: DndMonster[], pages: number } | undefined => {
      if (response) {
        return {
          items: response.results.map(toMonster),
          pages: Math.ceil(response.count / 20),
        }
      }
    },
  })
}
