import { useQuery } from '@tanstack/vue-query'

export function useLiveState(
  token: ComputedRef<string | undefined>,
  seatToken: ComputedRef<string | undefined>,
) {
  return useQuery({
    queryKey: computed(() => queryKeys.liveState(token.value, seatToken.value)),
    queryFn: () =>
      $fetch<LiveStateResponse>('/api/encounter/live/state', {
        query: { token: token.value, seatToken: seatToken.value },
      }),
    enabled: computed(() => !!token.value),
    retry: (failureCount, error) =>
      failureCount < 3 && !isLiveSessionGone(error),
  })
}
