import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

const urlMap = new Map<Open5eType, string>([
  ['monsters', 'https://api.open5e.com/v1/monsters'],
  ['spells', 'https://api.open5e.com/v2/spells'],
  ['conditions', 'https://api.open5e.com/v1/conditions'],
  ['magicitems', 'https://api.open5e.com/v2/magicitems'],
  ['weapons', 'https://api.open5e.com/v2/weapons'],
  ['armor', 'https://api.open5e.com/v2/armor'],
  ['sections', 'https://api.open5e.com/v1/sections'],
])

export function useOpen5eListing(data: ComputedRef<{ type: Open5eType, filters: Open5eFilters }>) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5e', data],
    queryFn: async () => {
      try {
        const query = generateParams(removeEmptyKeys<Open5eFilters>({
          ...data.value.filters,
          limit: 20,
          page: data.value.filters.page + 1, // Open5e uses 1-based indexing
        }))

        const url = `${urlMap.get(data.value.type)}/?${query}`

        return await $fetch<Open5eResponse<Open5eItem>>(url)
      }
      catch (error: any) {
        toast({
          title: t('general.error.title'),
          description: error.message,
          variant: 'destructive',
        })
      }
    },
    select: (response) => {
      if (response) {
        return {
          items: response.results,
          pages: Math.ceil(response.count / 20),
        }
      }
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
        const { results } = await $fetch<Open5eResponse<Open5eDocument>>('https://api.open5e.com/v2/documents/?page=1&ordering=-publication_date')

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

async function fetchConditions() {
  const { toast } = useToast()
  const { t } = useI18n()

  try {
    const { results } = await $fetch<Open5eResponse<Open5eConditions>>('https://api.open5e.com/conditions/?page=1')

    return results.map(c => c.name === 'Exhaustion' ? { ...c, level: 1, hasLevels: true } : c)
  }
  catch (error: any) {
    toast({
      title: t('general.error.title'),
      description: error.message,
      variant: 'destructive',
    })
  }
}

export async function prefetchConditionsListing() {
  const queryClient = useQueryClient()

  return queryClient.prefetchQuery({
    queryKey: ['useConditionsListing'],
    queryFn: fetchConditions,
    staleTime: 1000 * 60 * 60 * 24,
  })
}

export async function useConditionsListing() {
  return useQuery({
    queryKey: ['useConditionsListing'],
    queryFn: fetchConditions,
  })
}
