import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useRealTimeInitiativeSheet(
  id: number,
  data: Ref<InitiativeSheet | undefined>,
) {
  const user = useAuthenticatedUser()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const isOnline = useOnline()
  const visibility = useDocumentVisibility()
  const turnReminders = createEventHook<TurnReminders>()

  let channel: RealtimeChannel | undefined

  const enabled = computed(() => {
    if (!data.value) return false

    return isPro(user.value)
  })

  function queryKey(): QueryKey {
    return queryKeys.initiativeSheetDetail(id)
  }

  function refetch(): void {
    void queryClient.invalidateQueries({ queryKey: queryKey() })
  }

  function catchUp(): void {
    if (!channel) return

    refetch()
    void queryClient.invalidateQueries({
      queryKey: queryKeys.combatEvents(id),
    })
  }

  function updateQueryData(payload: UpdateInitiativeSheetData): void {
    queryClient.setQueryData(queryKey(), (old: InitiativeSheet) => {
      if (!old) return old

      return {
        ...old,
        ...payload,
        ...(old?.campaign ? { campaign: old.campaign } : {}),
      }
    })
  }

  function applyAction(payload: SheetActionEvent): void {
    const current = queryClient.getQueryData<InitiativeSheet>(queryKey())

    if (!current || current.version >= payload.version) return

    if (current.version !== payload.version - 1) {
      refetch()
      return
    }

    queryClient.setQueryData<InitiativeSheet>(queryKey(), {
      ...current,
      version: payload.version,
      rows: current.rows.map(row =>
        row.id === payload.row ? { ...row, ...payload.patch } : row,
      ),
    })

    void queryClient.invalidateQueries({
      queryKey: queryKeys.combatEvents(id),
    })
  }

  function applySync(payload: SheetSyncEvent): void {
    const current = queryClient.getQueryData<InitiativeSheet>(queryKey())

    if (current && current.version >= payload.version) return

    queryClient.setQueryData<InitiativeSheet>(queryKey(), old => {
      if (!old)
        return { ...payload.sheet, version: payload.version } as InitiativeSheet

      return { ...old, ...payload.sheet, version: payload.version }
    })

    void queryClient.invalidateQueries({
      queryKey: queryKeys.combatEvents(id),
    })

    if (payload.reminders) void turnReminders.trigger(payload.reminders)
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

  function subscribe(): void {
    channel = supabase.channel(`sheet:${id}`)

    channel
      .on('broadcast', { event: 'action' }, ({ payload }) =>
        applyAction(payload as SheetActionEvent),
      )
      .on('broadcast', { event: 'sync' }, ({ payload }) =>
        applySync(payload as SheetSyncEvent),
      )
      .on('broadcast', { event: 'events' }, ({ payload }) =>
        applyEvents(payload as SheetEventsEvent),
      )
      .on('broadcast', { event: 'deleted' }, applyDeleted)
      .subscribe()
  }

  function unsubscribe(): void {
    if (!channel) return

    void supabase.removeChannel(channel)
    channel = undefined
  }

  onMounted(() => {
    if (enabled.value) subscribe()
  })

  watch(isOnline, online => {
    if (online) catchUp()
  })

  watch(visibility, state => {
    if (state === 'visible') catchUp()
  })

  onBeforeUnmount(unsubscribe)

  return {
    enabled,
    updateQueryData,
    onTurnReminders: turnReminders.on,
  }
}
