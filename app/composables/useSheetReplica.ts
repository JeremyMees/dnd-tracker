import type { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient, type QueryKey } from '@tanstack/vue-query'

interface VersionedEvent {
  version: number
}

interface SheetReplicaOptions<
  TState,
  TAction extends VersionedEvent,
  TSync extends VersionedEvent,
> {
  topic: MaybeRefOrGetter<string | undefined>
  queryKey: () => QueryKey
  version: (state: TState) => number
  withVersion: (state: TState, version: number) => TState
  mergeAction: (state: TState, event: TAction) => TState | undefined
  mergeSync: (state: TState, event: TSync) => TState | undefined
  onAction?: (event: TAction) => void
  onSync?: (event: TSync) => void
  onCatchUp?: () => void
  listen?: (channel: RealtimeChannel) => void
  onSubscribed?: (channel: RealtimeChannel) => void
}

export function useSheetReplica<
  TState,
  TAction extends VersionedEvent,
  TSync extends VersionedEvent,
>(options: SheetReplicaOptions<TState, TAction, TSync>) {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const isOnline = useOnline()
  const visibility = useDocumentVisibility()

  let channel: RealtimeChannel | undefined

  function refetch(): void {
    void queryClient.invalidateQueries({ queryKey: options.queryKey() })
  }

  function catchUp(): void {
    if (!channel) return

    refetch()
    options.onCatchUp?.()
  }

  function olderState(event: VersionedEvent): TState | undefined {
    const state = queryClient.getQueryData<TState>(options.queryKey())

    if (!state || options.version(state) >= event.version) return undefined

    return state
  }

  function write(next: TState | undefined, version: number): void {
    if (!next) {
      refetch()
      return
    }

    queryClient.setQueryData(
      options.queryKey(),
      options.withVersion(next, version),
    )
  }

  function applyAction(event: TAction): void {
    const state = olderState(event)

    if (!state) return

    const sequential = options.version(state) === event.version - 1

    write(
      sequential ? options.mergeAction(state, event) : undefined,
      event.version,
    )
    options.onAction?.(event)
  }

  function applySync(event: TSync): void {
    const state = olderState(event)

    if (!state) return

    write(options.mergeSync(state, event), event.version)
    options.onSync?.(event)
  }

  function subscribe(topic: string): void {
    const created = supabase.channel(topic)
    let joined = false

    channel = created

    created
      .on('broadcast', { event: 'action' }, ({ payload }) =>
        applyAction(payload as TAction),
      )
      .on('broadcast', { event: 'sync' }, ({ payload }) =>
        applySync(payload as TSync),
      )

    options.listen?.(created)

    created.subscribe(status => {
      if (status !== 'SUBSCRIBED') return

      if (joined) catchUp()

      joined = true
      options.onSubscribed?.(created)
    })
  }

  function unsubscribe(): void {
    if (!channel) return

    void supabase.removeChannel(channel)
    channel = undefined
  }

  watch(
    () => toValue(options.topic),
    topic => {
      unsubscribe()
      if (topic && import.meta.client) subscribe(topic)
    },
    { immediate: true },
  )

  watch(isOnline, online => {
    if (online) catchUp()
  })

  watch(visibility, state => {
    if (state === 'visible') catchUp()
  })

  onScopeDispose(unsubscribe)

  return { refetch }
}
