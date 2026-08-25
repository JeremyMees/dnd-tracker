import { useQuery } from '@tanstack/vue-query'

export function useCombatEvents(encounterId: number) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useCombatEvents', encounterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('combat_events')
        .select()
        .eq('encounterId', encounterId)
        .order('id', { ascending: false })

      if (error) throw createError(error)

      return data
    },
  })
}
