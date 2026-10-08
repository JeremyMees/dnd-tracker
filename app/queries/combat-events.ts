import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useCombatEvents(
  encounterId: number,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useCombatEvents', encounterId],
    enabled: () => (enabled === undefined ? true : toValue(enabled)),
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

export function useCombatEventsClear() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  return useMutation({
    mutationFn: async ({ encounterId }: { encounterId: number }) => {
      await $fetch(`/api/encounter/${encounterId}/events`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_result, { encounterId }) => {
      queryClient.setQueryData(['useCombatEvents', encounterId], [])
    },
    onError: error => {
      toast({
        title: t('pages.encounter.toasts.combatLogClearFailed'),
        description: t(`general.error.reasons.${getFailureReason(error)}`),
        variant: 'destructive',
      })
    },
  })
}
