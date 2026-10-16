import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async to => {
  const localePath = useLocalePath()
  const user = useState<AuthUser | null>('auth-user')

  const { params } = to

  if (!('id' in params) || !('title' in params) || isNaN(+params.id)) {
    return navigateTo(localePath('index'))
  }

  try {
    const encounterId = +params.id
    const { data } = await getEncounter(encounterId)

    // Owner can always access the page
    if (
      data.campaign
        ? data.campaign.createdBy.id === user.value?.id
        : data.createdBy === user.value?.id
    )
      return

    if (
      data.campaign &&
      isCampaignSuspendedFor(data.campaign.createdBy, user.value?.id ?? '')
    ) {
      return navigateTo(localePath('encounters'))
    }

    // If no campaign is associated or user is not a team member, deny access
    if (
      !data.campaign ||
      !data.campaign.team.some(member => member.user.id === user.value?.id)
    ) {
      return navigateTo(localePath('no-access'))
    }
  } catch {
    return navigateTo(localePath('index'))
  }
})

async function getEncounter(id: number): Promise<{ data: InitiativeSheet }> {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  const cachedData = queryClient.getQueryData<InitiativeSheet>(
    queryKeys.initiativeSheetDetail(id),
  )

  if (cachedData) return { data: cachedData }

  const { data, error } = await supabase
    .from('initiative_sheets')
    .select(
      `
      *, 
      campaign(
        id,
        title,
        createdBy(id, username, avatar, subscriptionType), 
        team(
          id,
          role, 
          user(id, username, avatar)
        )
      )
    `,
    )
    .eq('id', id)
    .single()
    .overrideTypes<InitiativeSheet, { merge: false }>()

  if (error) throw createError(error)

  queryClient.setQueryData(queryKeys.initiativeSheetDetail(id), data)

  return { data }
}
