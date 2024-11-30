export default defineNuxtRouteMiddleware(async ({ params, fullPath }) => {
  const supabase = useSupabaseClient<Database>()
  const localePath = useLocalePath()
  const user = useSupabaseUser()
  const id = params.id

  if (!id || isNaN(+id)) return navigateTo(localePath('/'))

  let expectedRole: UserRole = 'Owner'

  if (fullPath.includes('/settings')) expectedRole = 'Admin'
  else if (fullPath.includes('/content')) expectedRole = 'Viewer'

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        created_by,
        team(
          role,
          user
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw createError(error)

    if (data.created_by === user.value?.id) return // Owner can always access

    const member = data.team.find(member => member.user === user.value?.id)

    if (member) {
      if (hasPermission(member.role, expectedRole)) return
      else return navigateTo(
        expectedRole === 'Admin'
          ? fullPath.replace('/settings', '/content')
          : fullPath.replace('/danger-zone', '/content'),
      )
    }
    else return navigateTo(localePath('/no-access'))
  }
  catch (error) {
    return navigateTo(localePath('/'))
  }
})
