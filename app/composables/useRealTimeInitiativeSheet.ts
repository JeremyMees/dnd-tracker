import { useQueryClient } from '@tanstack/vue-query'
import { withPendingEdits } from '~/queries/initiative-sheets'
import { toast } from 'vue-sonner'

export function useRealTimeInitiativeSheet(
  id: number,
  data: Ref<InitiativeSheet | undefined>,
) {
  const user = useAuthenticatedUser()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const turnReminders = createEventHook<TurnReminders>()

  const enabled = computed(() => {
    if (!data.value) return false

    return isPro(user.value)
  })

  function refetchCombatEvents(): void {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.combatEvents(id),
    })
  }

  function applyEvents(payload: SheetEventsEvent): void {
    const queryKey = queryKeys.combatEvents(id)

    if (payload.cleared) queryClient.setQueryData(queryKey, [])
    else void queryClient.invalidateQueries({ queryKey })
  }

  async function applyDeleted(): Promise<void> {
    toast.warning(t('pages.encounter.toasts.removed.title'), {
      description: t('pages.encounter.toasts.removed.text'),
    })

    await navigateTo(localePath('encounters'))
  }

  useSheetReplica<InitiativeSheet, SheetActionEvent, SheetSyncEvent>({
    topic: () => (enabled.value ? `sheet:${id}` : undefined),
    queryKey: () => queryKeys.initiativeSheetDetail(id),
    version: sheet => sheet.version,
    withVersion: (sheet, version) => ({ ...sheet, version }),
    mergeAction: (sheet, { row, patch }) =>
      withPendingEdits(queryClient, id, {
        ...sheet,
        rows: withRowPatches(sheet.rows, [{ rowId: row, patch }]),
      }),
    mergeSync: (sheet, event) =>
      withPendingEdits(queryClient, id, { ...sheet, ...event.sheet }),
    onAction: refetchCombatEvents,
    onSync: ({ reminders }) => {
      refetchCombatEvents()
      if (reminders) void turnReminders.trigger(reminders)
    },
    onCatchUp: refetchCombatEvents,
    listen: channel =>
      channel
        .on('broadcast', { event: 'events' }, ({ payload }) =>
          applyEvents(payload as SheetEventsEvent),
        )
        .on('broadcast', { event: 'deleted' }, applyDeleted),
  })

  return {
    enabled,
    onTurnReminders: turnReminders.on,
  }
}
