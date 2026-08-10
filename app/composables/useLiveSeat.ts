import { StorageSerializers, useLocalStorage } from '@vueuse/core'

export function useLiveSeat() {
  const seat = useLocalStorage<LiveJoinResponse | null>('live-seat', null, {
    serializer: StorageSerializers.object,
  })

  function clear(): void {
    seat.value = null
  }

  return { seat, clear }
}
