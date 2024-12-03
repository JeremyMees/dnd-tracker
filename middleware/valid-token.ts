export default defineNuxtRouteMiddleware(async ({ query }) => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const localePath = useLocalePath()

  const { campaign, token } = query

  if (!campaign || isNaN(+campaign) || !token || !user.value) {
    return navigateTo(localePath('/'))
  }

  const { error } = await supabase
    .from('join_campaign')
    .select('id')
    .match({
      user: user.value.id,
      token: token,
      campaign: +campaign,
    })
    .single()

  if (error) navigateTo(localePath('/no-access'))
  else return
})
