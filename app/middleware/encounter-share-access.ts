import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const queryClient = useQueryClient()

  if (!to.query.token) return

  try {
    const encounter = await $fetch<InitiativeSheet>('/api/encounter/share', {
      query: { token: to.query.token },
    })

    if (!encounter) throw createError('No encounter found')

    queryClient.setQueryData(['useInitiativeSheetPlayground', to.query.token], encounter)
  }
  catch (error) {
    queryClient.removeQueries({ queryKey: ['useInitiativeSheetPlayground', to.query.token] })
    return navigateTo(localePath('/'))
  }
})
