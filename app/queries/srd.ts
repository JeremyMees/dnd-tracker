import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'
import { TEN_MINUTES, ONE_DAY } from '~~/constants/time'

function listingQuery(type: DndContentType, filters: DndContentFilters) {
  return {
    type,
    page: filters.page,
    search: filters.search ?? '',
    documents: filters.documents?.join(',') ?? '',
    ordering: filters.ordering ?? 'name',
    ...(filters.cr === undefined ? {} : { cr: filters.cr }),
  }
}

export function useSrdListing(
  data: ComputedRef<{ type: DndContentType; filters: DndContentFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useSrdListing', data],
    queryFn: async () => {
      try {
        return await $fetch<DndListingResult>('/api/srd/listing', {
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

export function useSrdDocuments() {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useSrdDocuments'],
    queryFn: async () => {
      try {
        return await $fetch<DndDocument[]>('/api/srd/documents')
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
      queryFn: () => $fetch<DndCondition[]>('/api/srd/conditions'),
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
        return await $fetch<DndCondition[]>('/api/srd/conditions')
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

export function useSrdMonsterListing(
  data: ComputedRef<{ filters: DndContentFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useSrdMonsterListing', data],
    queryFn: async () => {
      try {
        return await $fetch<DndListingResult>('/api/srd/listing', {
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
