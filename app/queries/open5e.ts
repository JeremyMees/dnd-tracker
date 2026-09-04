import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'
import { TEN_MINUTES, ONE_DAY } from '~~/constants/time'

const STALE_HEADER = 'x-open5e-stale-at'

function listingQuery(type: Open5eType, filters: Open5eFilters) {
  return {
    type,
    page: filters.page,
    search: filters.search ?? '',
    documents: filters.documents?.join(',') ?? '',
    ordering: filters.ordering ?? 'name',
    ...(filters.cr === undefined ? {} : { cr: filters.cr }),
  }
}

async function readOpen5e<T>(
  url: string,
  query?: Record<string, unknown>,
): Promise<{ data: T; staleAt: string | null }> {
  const response = await $fetch.raw<T>(url, { query })

  if (response._data === undefined) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Open5e returned an empty response',
    })
  }

  return { data: response._data, staleAt: response.headers.get(STALE_HEADER) }
}

export function useOpen5eListing(
  data: ComputedRef<{ type: Open5eType; filters: Open5eFilters }>,
) {
  const { toast } = useToast()
  const { t } = useI18n()
  const { trackOpen5eFreshness } = useOpen5eStatus()

  return useQuery({
    queryKey: ['useOpen5e', data],
    queryFn: async () => {
      try {
        const listing = await readOpen5e<Open5eListingResult>(
          '/api/open5e/listing',
          listingQuery(data.value.type, data.value.filters),
        )

        trackOpen5eFreshness(listing.staleAt)

        return listing.data
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
  const { trackOpen5eFreshness } = useOpen5eStatus()

  return useQuery({
    queryKey: ['useOpen5eDocuments'],
    queryFn: async () => {
      try {
        const documents = await readOpen5e<Open5eDocument[]>(
          '/api/open5e/documents',
        )

        trackOpen5eFreshness(documents.staleAt)

        return documents.data
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
  const { trackOpen5eFreshness } = useOpen5eStatus()

  return useQuery({
    queryKey: ['useConditionsListing'],
    queryFn: async () => {
      try {
        const conditions = await readOpen5e<DndCondition[]>(
          '/api/open5e/conditions',
        )

        trackOpen5eFreshness(conditions.staleAt)

        return conditions.data
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
  const { trackOpen5eFreshness } = useOpen5eStatus()

  return useQuery({
    queryKey: ['useOpen5eMonsterListing', data],
    queryFn: async () => {
      try {
        const listing = await readOpen5e<Open5eListingResult>(
          '/api/open5e/listing',
          listingQuery('monsters', data.value.filters),
        )

        trackOpen5eFreshness(listing.staleAt)

        return listing.data
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
