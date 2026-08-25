import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export type UpdateInitiativeSheetData = Omit<
  Partial<InitiativeSheet>,
  NotUpdatable | 'campaign'
>

interface SheetActionEvent {
  version: number
  row: string
  patch: Partial<InitiativeSheetRow>
}

interface SheetSyncEvent {
  version: number
  sheet: Partial<InitiativeSheet>
}

export function useRealTimeInitiativeSheet(
  id: number,
  data: Ref<InitiativeSheet | undefined>,
) {
  const user = useAuthenticatedUser()
  const { toast } = useToast()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  let channel: RealtimeChannel | undefined

  const enabled = computed(() => {
    if (!data.value) return false

    return isPro(user.value) && !!data.value.campaign
  })

  function queryKey(): unknown[] {
    return ['useInitiativeSheetDetail', id]
  }

  function refetch(): void {
    queryClient.invalidateQueries({ queryKey: queryKey() })
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

    queryClient.invalidateQueries({ queryKey: ['useCombatEvents', id] })
  }

  function applySync(payload: SheetSyncEvent): void {
    const current = queryClient.getQueryData<InitiativeSheet>(queryKey())

    if (current && current.version >= payload.version) return

    queryClient.setQueryData<InitiativeSheet>(queryKey(), old => {
      if (!old)
        return { ...payload.sheet, version: payload.version } as InitiativeSheet

      return { ...old, ...payload.sheet, version: payload.version }
    })
  }

  function applyDeleted(): void {
    toast({
      title: t('pages.encounter.toasts.removed.title'),
      description: t('pages.encounter.toasts.removed.text'),
      variant: 'warning',
    })

    navigateTo(localePath('/encounters'))
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
      .on('broadcast', { event: 'deleted' }, applyDeleted)
      .subscribe()
  }

  function unsubscribe(): void {
    if (!channel) return

    channel.unsubscribe()
    supabase.removeChannel(channel)
    channel = undefined
  }

  onMounted(() => {
    if (enabled.value) subscribe()
  })

  onBeforeUnmount(unsubscribe)

  return {
    enabled,
    updateQueryData,
  }
}
