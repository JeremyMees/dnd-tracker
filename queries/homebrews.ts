import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useHomebrewListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: ['useHomebrewListing', data, perPage],
    queryFn: () => sbQuery<HomebrewItemRow>({
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
    queryKey: ['useHomebrewCount', id],
    queryFn: async () => await supabase.from('homebrew_items').select('id', { count: 'exact' }).eq('campaign', id),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useHomebrewCreate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.homebrew').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: HomebrewItemInsert } & QueryDefaults) => {
      const { error } = await supabase.from('homebrew_items').insert([data])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useHomebrewListing'] })
      queryClient.invalidateQueries({ queryKey: ['useHomebrewCount'] })

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

export function useHomebrewUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.homebrew').toLowerCase()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<HomebrewItemUpdate, NotUpdatable>, id: number } & QueryDefaults) => {
      const { error } = await supabase.from('homebrew_items').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useHomebrewListing'] })
      queryClient.invalidateQueries({ queryKey: ['useHomebrewCount'] })

      toast({
        description: t('components.toast.update.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.update.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useHomebrewRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.homebrew').toLowerCase()

  return useMutation({
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('homebrew_items').delete()

      query = Array.isArray(id)
        ? query.in('id', id)
        : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useHomebrewListing'] })
      queryClient.invalidateQueries({ queryKey: ['useHomebrewCount'] })

      toast({
        title: t('components.toast.delete.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.delete.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
