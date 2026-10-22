import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useHomebrewListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: queryKeys.homebrewListing(data, perPage),
    queryFn: () =>
      sbQuery<HomebrewItemRow>({
        table: 'homebrew_items',
        fields: ['name', 'player'],
        filters: data.value,
        page: data.value.page,
        perPage,
        fuzzy: true,
      }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      homebrews: data,
    }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useHomebrewCount(id: number, enabled: ComputedRef<boolean>) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.homebrewCount(id),
    queryFn: async () =>
      await supabase
        .from('homebrew_items')
        .select('*', { count: 'exact', head: true })
        .eq('campaign', id),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useHomebrewCreate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.homebrew',
    action: 'create',
    mutationFn: async ({
      data,
    }: { data: HomebrewItemInsert } & QueryDefaults) => {
      const { data: created, error } = await supabase
        .from('homebrew_items')
        .insert([data])
        .select('id')
        .single()

      if (error) throw createError(error)

      return created.id
    },
    invalidate: () => [queryKeys.homebrewListing(), queryKeys.homebrewCount()],
  })
}

export function useHomebrewUpdate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.homebrew',
    action: 'update',
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<HomebrewItemUpdate, NotUpdatable>
      id: number
    } & QueryDefaults) => {
      const { error } = await supabase
        .from('homebrew_items')
        .update(data)
        .eq('id', id)
        .select('id')
        .single()

      if (error) throw createError(error)
    },
    invalidate: () => [queryKeys.homebrewListing(), queryKeys.homebrewCount()],
  })
}

export function useHomebrewRemove() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.homebrew',
    action: 'delete',
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('homebrew_items').delete()

      query = Array.isArray(id) ? query.in('id', id) : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    invalidate: () => [queryKeys.homebrewListing(), queryKeys.homebrewCount()],
  })
}

export function useHomebrewImport() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      data,
    }: { data: HomebrewItemInsert[] } & QueryDefaults) => {
      const { error } = await supabase.from('homebrew_items').insert(data)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { data }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.homebrewListing(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.homebrewCount(),
      })

      toast.success(
        t('components.toast.import.success', {
          count: data.length,
          type: t('general.homebrew', data.length).toLowerCase(),
        }),
      )
    },
    onError: error => {
      toast.error(
        t('components.toast.import.error', {
          type: t('general.homebrew', 2).toLowerCase(),
        }),
        { description: t(`general.error.reasons.${getFailureReason(error)}`) },
      )
    },
  })
}
