import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useCombatEvents(
  encounterId: number,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.combatEvents(encounterId),
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

export function optimisticCombatEvents(
  encounterId: number,
  round: number,
  drafts: CombatEventDraft[],
  rowId: string | null = null,
): CombatEventRow[] {
  return drafts
    .slice()
    .reverse()
    .map((draft, index) => ({
      id: -(Date.now() + index),
      encounterId,
      rowId: draft.rowId ?? rowId,
      round,
      type: draft.type,
      payload: draft.payload as Json,
      createdBy: null,
      actorName: null,
      createdAt: new Date().toISOString(),
    }))
}

export function useCombatEventsLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      encounterId,
      events,
    }: {
      encounterId: number
      events: CombatEventDraft[]
    }) => {
      await $fetch(`/api/encounter/${encounterId}/events`, {
        method: 'POST',
        body: { events },
      })
    },
    onMutate: ({ encounterId, events }) => {
      const round =
        queryClient.getQueryData<InitiativeSheet>(
          queryKeys.initiativeSheetDetail(encounterId),
        )?.round ?? 1

      queryClient.setQueryData<CombatEventRow[]>(
        queryKeys.combatEvents(encounterId),
        old =>
          old && [
            ...optimisticCombatEvents(encounterId, round, events),
            ...old,
          ],
      )
    },
    onSettled: (_result, _error, { encounterId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.combatEvents(encounterId),
      })
    },
  })
}

export function useCombatEventsClear() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useMutation({
    mutationFn: async ({ encounterId }: { encounterId: number }) => {
      await $fetch(`/api/encounter/${encounterId}/events`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_result, { encounterId }) => {
      queryClient.setQueryData(queryKeys.combatEvents(encounterId), [])
    },
    onError: error => {
      toast.error(t('pages.encounter.toasts.combatLogClearFailed'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
