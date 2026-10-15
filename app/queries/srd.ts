import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
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
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { t } = useI18n()

  return useQuery({
    queryKey: queryKeys.srdListing(data),
    queryFn: async () => {
      try {
        return await $fetch<DndListingResult>('/api/srd/listing', {
          query: listingQuery(data.value.type, data.value.filters),
        })
      } catch (error) {
        toast.error(t('general.error.loadFailed.content'), {
          description: t(`general.error.reasons.${getFailureReason(error)}`),
        })

        throw error
      }
    },
    staleTime: TEN_MINUTES,
    gcTime: TEN_MINUTES,
    retry: false,
    enabled,
  })
}

export function useSrdDocuments() {
  const { t } = useI18n()

  return useQuery({
    queryKey: queryKeys.srdDocuments(),
    queryFn: async () => {
      try {
        return await $fetch<DndDocument[]>('/api/srd/documents')
      } catch (error) {
        toast.error(t('general.error.loadFailed.documents'), {
          description: t(`general.error.reasons.${getFailureReason(error)}`),
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
      queryKey: queryKeys.conditionsListing(),
      queryFn: () => $fetch<DndCondition[]>('/api/srd/conditions'),
      staleTime: ONE_DAY,
      gcTime: ONE_DAY,
    })
    .catch(() => undefined)
}

export function useConditionsListing() {
  const { t } = useI18n()

  return useQuery({
    queryKey: queryKeys.conditionsListing(),
    queryFn: async () => {
      try {
        return await $fetch<DndCondition[]>('/api/srd/conditions')
      } catch (error) {
        toast.error(t('general.error.loadFailed.conditions'), {
          description: t(`general.error.reasons.${getFailureReason(error)}`),
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
  const { t } = useI18n()

  return useQuery({
    queryKey: queryKeys.srdMonsterListing(data),
    queryFn: async () => {
      try {
        return await $fetch<DndListingResult>('/api/srd/listing', {
          query: listingQuery('monsters', data.value.filters),
        })
      } catch (error) {
        toast.error(t('general.error.loadFailed.monsters'), {
          description: t(`general.error.reasons.${getFailureReason(error)}`),
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
