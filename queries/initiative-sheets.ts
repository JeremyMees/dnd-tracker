import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

export function useInitiativeSheetDetail(id: number) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useInitiativeSheetDetail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('initiative_sheets')
        .select(`
        *, 
        campaign(
          id,
          title,
          created_by(id, username, avatar), 
          team(
            id,
            role, 
            user(id, username, avatar)
          )
        )
      `)
        .eq('id', id)
        .single()

      if (error) throw createError(error)
      else return data as InitiativeSheet
    },
  })
}

export function useInitiativeSheetDetailUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<InitiativeUpdate, NotUpdatable | 'campaign'>, id: number } & QueryDefaults) => {
      if (data.rows?.length) data.rows = indexCorrect(data.rows)

      const { error } = await supabase.from('initiative_sheets').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onMutate: async ({ data, id }) => {
      await queryClient.cancelQueries({ queryKey: ['useInitiativeSheetDetail', id] })

      const previous = queryClient.getQueryData<InitiativeSheet>(['useInitiativeSheetDetail', id])

      queryClient.setQueryData(
        ['useInitiativeSheetDetail', id],
        (old: InitiativeSheet) => ({ ...old, ...data, rows: data.rows || old.rows }),
      )

      return { previous }
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()
    },
    onError: (error, { onError, id }, context) => {
      if (context?.previous) { // roll back the optimistic update
        queryClient.setQueryData(['useInitiativeSheetDetail', id], context.previous)
      }

      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
