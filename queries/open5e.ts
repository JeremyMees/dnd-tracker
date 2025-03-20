import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export function useOpen5eListing(data: ComputedRef<{ type: Open5eType, filters: Open5eFilters }>) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5e', data],
    queryFn: async () => {
      const queryFilters: Open5eFilters = {
        ...data.value.filters,
        limit: 20,
        page: data.value.filters.page + 1, // Open5e uses 1-based indexing
        document__slug: 'wotc-srd',
      }

      try {
        const query = generateParams(removeEmptyKeys<Open5eFilters>(queryFilters))

        const url = `https://api.open5e.com/${data.value.type}/?${query}`

        return await $fetch<Open5eResponse>(url)
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
    placeholderData: keepPreviousData,
  })
}

async function fetchConditions() {
  const { toast } = useToast()
  const { t } = useI18n()

  try {
    const { results } = await $fetch<Open5eResponse>('https://api.open5e.com/conditions/?page=1')

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
