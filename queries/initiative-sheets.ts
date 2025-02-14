import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'

export function useInitiativeSheetDetail(id: number) {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useInitiativeSheetDetail', id],
    queryFn: async () => await supabase
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
      .single(),
    select: ({ data }) => data,
    placeholderData: keepPreviousData,
  })
}

export function useInitiativeSheetDetailUpdate() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<InitiativeUpdate, NotUpdatable>, id: number } & QueryDefaults) => {
      if (data.rows?.length) data.rows = indexCorrect(data.rows)

      const { error } = await supabase.from('initiative_sheets').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useInitiativeSheetDetail', id] })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
