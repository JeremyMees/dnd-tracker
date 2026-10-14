import { keepPreviousData, useQuery } from '@tanstack/vue-query'

export function useNoteListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: ['useNoteListing', data, perPage],
    queryFn: () =>
      sbQuery<NoteRow>({
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
    queryFn: async () =>
      await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('campaign', id),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useNoteCreate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.note',
    action: 'create',
    mutationFn: async ({ data }: { data: NoteInsert } & QueryDefaults) => {
      const { error } = await supabase.from('notes').insert([data])

      if (error) throw createError(error)
    },
    invalidate: () => [['useNoteListing'], ['useNoteCount']],
  })
}

export function useNoteUpdate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.note',
    action: 'update',
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<NoteUpdate, NotUpdatable>
      id: number
    } & QueryDefaults) => {
      const { error } = await supabase.from('notes').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    invalidate: () => [['useNoteListing'], ['useNoteCount']],
  })
}

export function useNoteRemove() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.note',
    action: 'delete',
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('notes').delete()

      query = Array.isArray(id) ? query.in('id', id) : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    invalidate: () => [['useNoteListing'], ['useNoteCount']],
  })
}
