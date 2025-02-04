import { useQueryClient } from '@tanstack/vue-query'

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const user = useSupabaseUser()

  if (!to.params.title || !to.params.id || isNaN(+to.params.id)) {
    return navigateTo(localePath('/'))
  }

  const page = determinePageType(to.fullPath)

  // Redirect to encounters page if user tries to access index page
  if (page === 'index') return navigateTo(`${to.fullPath}/encounters`)

  const expectedRole = getExpectedRole(page)

  try {
    const { data } = await getCampaign(+to.params.id)

    // Owner can always access the page
    if (data.created_by === user.value?.id) return

    const member = data.team.find(member => member.user === user.value?.id)

    if (!member) return navigateTo(localePath('/no-access'))

    // Check if user has permission to access the page
    if (hasPermission(member.role, expectedRole)) return

    return navigateTo(
      expectedRole === 'Admin'
        ? to.fullPath.replace('/settings', '/encounters')
        : to.fullPath.replace('/danger-zone', '/encounters'),
    )
  }
  catch (error) {
    return navigateTo(localePath('/'))
  }
})

type CampaignMember = {
  id: number
  created_by: string
  team: {
    role: UserRole
    user: string
  }[]
  join_campaign: {
    role: UserRole
    user: string
  }[]
}

function determinePageType(fullPath: string): string {
  const pages = {
    '/encounters': 'encounters',
    '/homebrews': 'homebrews',
    '/notes': 'notes',
    '/settings': 'settings',
    '/danger-zone': 'danger-zone',
  }

  for (const [path, pageName] of Object.entries(pages)) {
    if (fullPath.includes(path)) return pageName
  }

  return 'index'
}

function getExpectedRole(page: string): UserRole {
  if (page === 'settings') return 'Admin'
  if (['encounters', 'index', 'homebrews', 'notes'].includes(page)) return 'Viewer'
  return 'Owner'
}

async function getCampaign(id: number): Promise<{ data: CampaignMember }> {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  const cachedData = queryClient.getQueryData<CampaignMember>(['useCampaignMember', id])

  if (cachedData) return { data: cachedData }

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
    .eq('id', id)
    .single()

  if (error) throw createError(error)

  queryClient.setQueryData(['useCampaignMember', id], data)

  return { data }
}
