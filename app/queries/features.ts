import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useFeatureListing(data: ComputedRef<SbFilter>) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.featureListing(data),
    queryFn: async () => {
      const result = await sbQuery<FeatureRow & { voted: FeatureVotes }>({
        table: 'features',
        select: '*',
        filters: data.value,
        page: data.value.page,
        perPage: 10,
        fuzzy: true,
      })

      const ids = [...new Set(result.data.map(({ createdBy }) => createdBy))]

      if (!ids.length) return { ...result, data: [] as FeatureRequest[] }

      const { data: cards, error } = await supabase.rpc('profile_cards', {
        p_ids: ids,
      })

      if (error) throw createError(error)

      const byId = new Map(cards.map(card => [card.id, card]))

      return {
        ...result,
        data: result.data.flatMap(feature => {
          const createdBy = byId.get(feature.createdBy)

          return createdBy ? [{ ...feature, createdBy }] : []
        }),
      }
    },
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      features: data,
    }),
    placeholderData: keepPreviousData,
  })
}

export function useFeatureCount() {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.featureCount(),
    queryFn: async () =>
      await supabase
        .from('features')
        .select('*', { count: 'exact', head: true }),
    select: ({ count }) => count || 0,
  })
}

export function useFeatureCreate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.featureRequest',
    action: 'create',
    mutationFn: async ({ data }: { data: FeatureInsert } & QueryDefaults) => {
      const { error } = await supabase.from('features').insert([data])

      if (error) throw createError(error)
    },
    invalidate: () => [queryKeys.featureListing(), queryKeys.featureCount()],
  })
}

export function useFeatureVote() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      id,
      vote,
    }: { id: number; vote: FeatureVote | null } & QueryDefaults) => {
      const { error } = await supabase.rpc('vote_feature', {
        p_feature: id,
        p_vote: vote ?? '',
      })

      if (error) throw createError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureListing() })
    },
    onError: error => {
      toast.error(t('general.error.failed.vote'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
