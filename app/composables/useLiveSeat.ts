import { StorageSerializers, useLocalStorage } from '@vueuse/core'

export function useLiveSeat() {
  const seat = useLocalStorage<LiveJoinResponse | null>('live-seat', null, {
    serializer: StorageSerializers.object,
  })

  const ownRowId = computed(() => {
    if (!seat.value || seat.value.spectator) return undefined

    return seat.value.row
  })

  function clear(): void {
    seat.value = null
  }

  return { seat, ownRowId, clear }
}
