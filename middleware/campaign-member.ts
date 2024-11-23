export default defineNuxtRouteMiddleware(async ({ params }) => {
  const supabase = useSupabaseClient<Database>()
  const localePath = useLocalePath()
  const user = useSupabaseUser()
  const id = params.id

  if (!id || isNaN(+id)) {
    return navigateTo(localePath('/'))
  }

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
    if (data.created_by === user.value?.id) return // Owner can access
    else if (!data.team.some(member => member.user === user.value?.id)) {
      return navigateTo(localePath('/no-access'))
    }
  }
  catch (error) {
    return navigateTo(localePath('/'))
  }
})
