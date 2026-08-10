import { useQuery } from '@tanstack/vue-query'

export function useLiveState(token: ComputedRef<string | undefined>) {
  return useQuery({
    queryKey: ['useLiveState', token],
    queryFn: () =>
      $fetch<LiveStateResponse>('/api/live/state', {
        query: { token: token.value },
      }),
    enabled: computed(() => !!token.value),
  })
}
