import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const user = useSupabaseUser()

  if (!to.params.title || !to.params.id || isNaN(+to.params.id)) {
    return navigateTo(localePath('/'))
  }

  try {
    const encounterId = +to.params.id
    const { data } = await getEncounter(encounterId)

    // Owner can always access the page
    if (data.created_by === user.value?.id) return

    // If no campaign is associated or user is not a team member, deny access
    if (!data.campaign || !data.campaign.team.some(member => member.user.id === user.value?.id)) {
      return navigateTo(localePath('/no-access'))
    }
  }
  catch (error) {
    return navigateTo(localePath('/'))
  }
})

async function getEncounter(id: number): Promise<{ data: InitiativeSheet }> {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  const cachedData = queryClient.getQueryData<InitiativeSheet>(['useInitiativeSheetDetail', id])

  if (cachedData) return { data: cachedData }

  const { data, error } = await supabase
    .from('initiative_sheets')
    .select(`
      *, 
      campaign(
        id,
        title,
        created_by(id, username, avatar), 
        team(
          id,
          role, 
          user(id, username, avatar)
        )
      )
    `)
    .eq('id', id)
    .returns<InitiativeSheet>()
    .single()

  if (error) throw createError(error)

  queryClient.setQueryData(['useInitiativeSheetDetail', id], data)

  return { data }
}
