export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient<Database>()
  const localePath = useLocalePath()
  const user = useSupabaseUser()

  if (!to.params.title || !to.params.id || isNaN(+to.params.id)) {
    return navigateTo(localePath('/'))
  }

  let page: 'index' | 'encounters' | 'homebrews' | 'notes' | 'settings' | 'danger-zone' = 'index'

  if (to.fullPath.includes('/encounters')) page = 'encounters'
  else if (to.fullPath.includes('/homebrews')) page = 'homebrews'
  else if (to.fullPath.includes('/notes')) page = 'notes'
  else if (to.fullPath.includes('/settings')) page = 'settings'
  else if (to.fullPath.includes('/danger-zone')) page = 'danger-zone'

  // Redirect to encounters page if user tries to access index page
  if (page === 'index') return navigateTo(`${to.fullPath}/encounters`)

  let expectedRole: UserRole = 'Owner'

  if (page === 'settings') expectedRole = 'Admin'
  else if (['encounters', 'index', 'homebrews', 'notes'].includes(page)) expectedRole = 'Viewer'

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        created_by,
        team(
          role,
          user
        ),
        join_campaign(
          role,
          user
        )
      `)
      .eq('id', to.params.id)
      .single()

    if (error) throw createError(error)

    // Owner can always access the page
    if (data.created_by === user.value?.id) return

    const member = data.team.find(member => member.user === user.value?.id)

    // check if user has permission to access the page
    if (member) {
      if (hasPermission(member.role, expectedRole)) return
      else return navigateTo(
        expectedRole === 'Admin'
          ? to.fullPath.replace('/settings', '/encounters')
          : to.fullPath.replace('/danger-zone', '/encounters'),
      )
    }
    else return navigateTo(localePath('/no-access'))
  }
  catch (error) {
    return navigateTo(localePath('/'))
  }
})
