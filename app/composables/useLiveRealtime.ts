import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/vue-query'

export function useLiveRealtime(
  token: ComputedRef<string | undefined>,
  uuid: ComputedRef<string | undefined>,
  seat: ComputedRef<string | undefined>,
) {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const isOnline = useOnline()
  const visibility = useDocumentVisibility()

  let channel: RealtimeChannel | undefined

  function queryKey(): unknown[] {
    return ['useLiveState', token.value]
  }

  function refetch(): void {
    queryClient.invalidateQueries({ queryKey: queryKey() })
  }

  function applyAction(payload: LiveActionEvent): void {
    const current = queryClient.getQueryData<LiveStateResponse>(queryKey())

    if (!current || current.session.version >= payload.version) return

    if (current.session.version !== payload.version - 1) {
      refetch()
      return
    }

    queryClient.setQueryData<LiveStateResponse>(queryKey(), {
      ...current,
      session: { ...current.session, version: payload.version },
      sheet: {
        ...current.sheet,
        rows: current.sheet.rows.map(row =>
          row.id === payload.row ? { ...row, ...payload.patch } : row,
        ),
      },
    })
  }

  function applySync(payload: LiveSyncEvent): void {
    const current = queryClient.getQueryData<LiveStateResponse>(queryKey())

    if (current && current.session.version >= payload.version) return

    queryClient.setQueryData<LiveStateResponse>(queryKey(), old => ({
      sheet: payload.sheet,
      session: {
        code: old?.session.code ?? '',
        expiresAt: old?.session.expiresAt ?? '',
        version: payload.version,
      },
    }))
  }

  function subscribe(sessionUuid: string): void {
    channel = supabase.channel(`live:${sessionUuid}`)

    channel
      .on('broadcast', { event: 'action' }, ({ payload }) =>
        applyAction(payload as LiveActionEvent),
      )
      .on('broadcast', { event: 'sync' }, ({ payload }) =>
        applySync(payload as LiveSyncEvent),
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED' && seat.value) {
          channel!.track({ seat: seat.value })
        }
      })
  }

  function unsubscribe(): void {
    if (!channel) return

    channel.unsubscribe()
    supabase.removeChannel(channel)
    channel = undefined
  }

  watch(
    uuid,
    newUuid => {
      unsubscribe()
      if (newUuid) subscribe(newUuid)
    },
    { immediate: true },
  )

  watch(isOnline, online => {
    if (online) refetch()
  })

  watch(visibility, state => {
    if (state === 'visible') refetch()
  })

  onScopeDispose(unsubscribe)
}
