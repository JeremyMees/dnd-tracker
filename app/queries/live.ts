import { useQuery } from '@tanstack/vue-query'

export function liveStateQueryKey(
  token: string | undefined,
  seatToken: string | undefined,
): unknown[] {
  return ['useLiveState', token, seatToken]
}

export function useLiveState(
  token: ComputedRef<string | undefined>,
  seatToken: ComputedRef<string | undefined>,
) {
  return useQuery({
    queryKey: computed(() => liveStateQueryKey(token.value, seatToken.value)),
    queryFn: () =>
      $fetch<LiveStateResponse>('/api/live/state', {
        query: { token: token.value, seatToken: seatToken.value },
      }),
    enabled: computed(() => !!token.value),
  })
}
