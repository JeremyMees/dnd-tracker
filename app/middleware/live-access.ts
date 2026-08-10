import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async to => {
  const queryClient = useQueryClient()
  const code = to.query.code

  if (!code || typeof code !== 'string') return

  try {
    const session = await $fetch<{ code: string; expiresAt: string }>(
      '/api/live/code',
      { query: { code } },
    )

    queryClient.setQueryData(['useLiveCode', code], session)
  } catch (error) {
    queryClient.setQueryData(
      ['useLiveCodeError', code],
      (error as { statusCode?: number })?.statusCode ?? 500,
    )
  }
})
