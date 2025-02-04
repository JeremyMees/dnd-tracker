import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useNoteListing(data: ComputedRef<SbFilter>) {
  return useQuery({
    queryKey: ['useNoteListing', data],
    queryFn: () => sbQuery<NoteRow>({
      table: 'notes',
      filters: data.value,
      page: data.value.page,
      perPage: 10,
      fuzzy: true,
      ...(data.value.eq && { eq: data.value.eq }),
    }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      notes: data,
    }),
  })
}

export function useNoteCount(id: number) {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useNoteCount', id],
    queryFn: async () => await supabase.from('notes').select('id', { count: 'exact' }).eq('campaign', id),
    select: ({ count }) => count || 0,
  })
}

export function useNoteCreate() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note')

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
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note')

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
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.note')

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
