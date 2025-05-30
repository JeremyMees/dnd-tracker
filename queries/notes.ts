import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useNoteListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: ['useNoteListing', data, perPage],
    queryFn: () => sbQuery<NoteRow>({
      table: 'notes',
      filters: data.value,
      page: data.value.page,
      perPage,
      fuzzy: true,
    }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      notes: data,
    }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useNoteCount(id: number, enabled: ComputedRef<boolean>) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useNoteCount', id],
    queryFn: async () => await supabase.from('notes').select('id', { count: 'exact' }).eq('campaign', id),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useNoteCreate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: NoteInsert } & QueryDefaults) => {
      const { error } = await supabase.from('notes').insert([data])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useNoteListing'] })
      queryClient.invalidateQueries({ queryKey: ['useNoteCount'] })

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

export function useNoteUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note').toLowerCase()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<NoteUpdate, NotUpdatable>, id: number } & QueryDefaults) => {
      const { error } = await supabase.from('notes').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useNoteListing'] })
      queryClient.invalidateQueries({ queryKey: ['useNoteCount'] })

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

export function useNoteRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note').toLowerCase()

  return useMutation({
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('notes').delete()

      query = Array.isArray(id)
        ? query.in('id', id)
        : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useNoteListing'] })
      queryClient.invalidateQueries({ queryKey: ['useNoteCount'] })

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
