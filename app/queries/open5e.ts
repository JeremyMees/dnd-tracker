import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'
import { TEN_MINUTES, ONE_DAY } from '~~/constants/time'

function listingQuery(type: Open5eType, filters: Open5eFilters) {
  return {
    type,
    page: filters.page,
    search: filters.name__icontains ?? '',
    documents: filters.document__key__in ?? '',
    ordering: filters.ordering ?? 'name',
    ...(filters.cr === undefined ? {} : { cr: filters.cr }),
  }
}

export function useOpen5eListing(
  data: ComputedRef<{ type: Open5eType; filters: Open5eFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useOpen5e', data],
    queryFn: async () => {
      try {
        return await $fetch<Open5eListingResult>('/api/open5e/listing', {
          query: listingQuery(data.value.type, data.value.filters),
        })
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
        })

        throw error
      }
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
        return await $fetch<Open5eDocument[]>('/api/open5e/documents')
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
      queryFn: () => $fetch<DndCondition[]>('/api/open5e/conditions'),
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
        return await $fetch<DndCondition[]>('/api/open5e/conditions')
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
        return await $fetch<Open5eListingResult>('/api/open5e/listing', {
          query: listingQuery('monsters', data.value.filters),
        })
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
      if (response?.type !== 'monsters') return

      return { items: response.items, pages: response.pages }
    },
    staleTime: TEN_MINUTES,
    gcTime: TEN_MINUTES,
    retry: false,
  })
}
