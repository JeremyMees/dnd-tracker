import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

export function useInitiativeSheetDetail(id: number) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useInitiativeSheetDetail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('initiative_sheets')
        .select(
          `
        *, 
        campaign(
          id,
          title,
          createdBy(id, username, avatar), 
          team(
            id,
            role, 
            user(id, username, avatar)
          )
        )
      `,
        )
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
  const { mutateAsync: sync } = useInitiativeSheetSync()

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<InitiativeUpdate, NotUpdatable | 'campaign'>
      id: number
    } & QueryDefaults) => {
      if (data.rows?.length) {
        data.rows = indexCorrect(data.rows).map(row => ({
          ...sanitizeRowNumbers(row),
          conditions: row.conditions.map(c => ({
            ...c,
            desc: c.desc ?? '',
          })),
        }))
      }

      const { error } = await supabase
        .from('initiative_sheets')
        .update(data)
        .eq('id', id)

      if (error) throw createError(error)
    },
    onMutate: async ({ data, id }) => {
      await queryClient.cancelQueries({
        queryKey: ['useInitiativeSheetDetail', id],
      })

      const previous = queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        id,
      ])

      queryClient.setQueryData(
        ['useInitiativeSheetDetail', id],
        (old: InitiativeSheet) => ({
          ...old,
          ...data,
          rows: data.rows || old.rows,
        }),
      )

      return { previous }
    },
    onSuccess: (_data, { id, onSuccess }) => {
      sync({ id }).catch(() => {})

      if (onSuccess) onSuccess()
    },
    onError: (error, { onError, id }, context) => {
      if (context?.previous) {
        // roll back the optimistic update
        queryClient.setQueryData(
          ['useInitiativeSheetDetail', id],
          context.previous,
        )
      }

      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useInitiativeSheetSync() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await $fetch(`/api/encounter/${id}/sync`, { method: 'POST' })
    },
  })
}

export function useInitiativeSheetPatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      rowId,
      patch,
    }: {
      id: number
      rowId: string
      patch: Partial<InitiativeSheetRow>
    } & QueryDefaults) => {
      const { row } = await $fetch<{ row: InitiativeSheetRow }>(
        `/api/encounter/${id}/patch-row`,
        { method: 'POST', body: { rowId, patch } },
      )

      return row
    },
    onMutate: async ({ id, rowId, patch }) => {
      await queryClient.cancelQueries({
        queryKey: ['useInitiativeSheetDetail', id],
      })

      const previous = queryClient.getQueryData<InitiativeSheet>([
        'useInitiativeSheetDetail',
        id,
      ])

      queryClient.setQueryData(
        ['useInitiativeSheetDetail', id],
        (old: InitiativeSheet) => {
          if (!old) return old

          return {
            ...old,
            rows: old.rows.map(row =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          }
        },
      )

      return { previous }
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()
    },
    onError: (error, { onError, id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['useInitiativeSheetDetail', id],
          context.previous,
        )
      }

      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
