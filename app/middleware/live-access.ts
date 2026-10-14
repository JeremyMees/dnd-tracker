import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async to => {
  const queryClient = useQueryClient()
  const code = to.query.code

  if (!code || typeof code !== 'string') return

  try {
    const session = await $fetch<{ code: string; expiresAt: string }>(
      '/api/encounter/live/code',
      { query: { code } },
    )

    queryClient.setQueryData(queryKeys.liveCode(code), session)
  } catch (error) {
    queryClient.setQueryData(
      queryKeys.liveCodeError(code),
      (error as { statusCode?: number })?.statusCode ?? 500,
    )
  }
})
