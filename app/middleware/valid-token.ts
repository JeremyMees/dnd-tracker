import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async ({ query }) => {
  const supabase = useSupabaseClient<DB>()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()

  const { token } = query

  if (!token || typeof token !== 'string') {
    return navigateTo(localePath('/'))
  }

  const { campaign, user, role } = await $fetch('/api/campaign/validate-join', {
    method: 'POST',
    body: { token },
  })

  const { data, error } = await supabase
    .from('join_campaign')
    .select(`
      id,
      role,
      user,
      campaign(
        id,
        title
      )
    `)
    .match({ token, user, campaign, role })
    .single()

  if (error) navigateTo(localePath('/no-access'))

  queryClient.setQueryData(['useJoinCampaign', token], data)
})
