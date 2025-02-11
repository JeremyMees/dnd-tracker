import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useFeatureListing(data: ComputedRef<SbFilter>) {
  return useQuery({
    queryKey: ['useFeatureListing', data],
    queryFn: () => sbQuery<FeatureRequest>({
      table: 'features',
      select: '*, created_by(id, avatar, username)',
      filters: data.value,
      page: data.value.page,
      perPage: 10,
      fuzzy: true,
    }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      features: data,
    }),
    placeholderData: keepPreviousData,
  })
}

export function useFeatureCount() {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useFeatureCount'],
    queryFn: async () => await supabase.from('features').select('id', { count: 'exact' }),
    select: ({ count }) => count || 0,
  })
}

export function useFeatureCreate() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.featureRequest').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: FeatureInsert } & QueryDefaults) => {
      const { error } = await supabase.from('features').insert([data])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useFeatureListing'] })
      queryClient.invalidateQueries({ queryKey: ['useFeatureCount'] })

      toast({
        description: t('components.toast.create.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.create.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useFeatureVote() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  return useMutation({
    mutationFn: async ({ id, votes }: { id: number, votes: FeatureVotes } & QueryDefaults) => {
      const { error } = await supabase.from('features').update({ voted: votes } as never).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useFeatureListing'] })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
