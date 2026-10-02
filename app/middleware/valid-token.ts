import { useQueryClient } from '@tanstack/vue-query'

interface Invite {
  campaign: number
  user: string
  role: UserRole
}

export default defineNuxtRouteMiddleware(async ({ query }) => {
  const supabase = useSupabaseClient<DB>()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()

  const { token } = query

  if (!token || typeof token !== 'string') {
    return navigateTo(localePath('/'))
  }

  let invite: Invite

  try {
    invite = await $fetch<Invite>('/api/campaign/validate-join', {
      method: 'POST',
      body: { token },
    })
  } catch (error) {
    const expired = (error as { statusCode?: number }).statusCode === 410

    return navigateTo(
      localePath(expired ? '/no-access?reason=expired' : '/no-access'),
    )
  }

  const { campaign, user, role } = invite

  const { data, error } = await supabase
    .from('join_campaign')
    .select(
      `
      id,
      role,
      user,
      campaign(
        id,
        title
      )
    `,
    )
    .match({ token, user, campaign, role })
    .single()

  if (error) return navigateTo(localePath('/no-access'))

  queryClient.setQueryData(['useJoinCampaign', token], data)
})
