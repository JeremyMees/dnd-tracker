export const useCampaigns = defineStore('useCampaigns', () => {
  const supabase = useSupabaseClient<Database>()
  const profile = useProfile()
  const toast = useToast()

  const amount = ref<number>(0)
  const pages = ref<number>(0)
  const perPage = ref<number>(10)

  const max = computed<number>(() => getMax(
    'campaign',
    profile.data?.subscription_type || 'free',
  ))

  async function get(filter: SbFilter): Promise<CampaignItem[] | undefined> {
    try {
      const { data, count, totalPages } = await sbQuery<CampaignItem>({
        table: 'campaigns',
        select: `
          *,
            created_by(id, username, avatar),
            initiative_sheets(count),
            homebrew_items(count),
            team(
              id,
              role,
              user(id, username, avatar)
            )
        `,
        filters: filter,
        page: filter.page,
        perPage: perPage.value,
        fuzzy: true,
      })

      amount.value = count
      pages.value = totalPages

      return data?.map(campaign => ({
        ...campaign,
        homebrew_items: sbCount('homebrew_items', data),
        initiative_sheets: sbCount('initiative_sheets', data),
      }))
    }
    catch (err) {
      toast.error()
    }
  }

  async function getCount(): Promise<number> {
    const { count } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })

    return count || 0
  }

  async function getCampaignById(id: number): Promise<CampaignFull> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *, 
        created_by(id, username, avatar, name, email), 
        team(
          id,
          role,
          user(id, username, avatar, name, email)
        ), 
        join_campaign(
          id,
          role,
          user(id, username, avatar, name, email)
        )
      `)
      .eq('id', id)
      .returns<CampaignFull>()
      .single()

    if (error) throw createError(error)
    else return data
  }

  async function getCampaignsMinimal(): Promise<CampaignMinimal[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        created_by(id, username, avatar),
        team(
          id,
          role,
          user(id, username, avatar)
        )
      `)
      .returns<CampaignMinimal[]>()

    if (error) throw createError(error)
    else return data
  }

  async function getCampaignMinimalById(id: number): Promise<CampaignMinimal> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        created_by(id, username, avatar),
        team(
          id,
          role,
          user(id, username, avatar)
        )
      `)
      .eq('id', id)
      .returns<CampaignMinimal>()
      .single()

    if (error) throw createError(error)
    else return data
  }

  async function addCampaign(campaign: CampaignInsert): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .insert([campaign])

    if (error) throw createError(error)
  }

  async function deleteCampaign(id: number | number[]): Promise<void> {
    let query = supabase.from('campaigns').delete()

    query = Array.isArray(id)
      ? query.in('id', id)
      : query.eq('id', id)

    const { error } = await query

    if (error) throw createError(error)
  }

  async function updateCampaign(campaign: CampaignUpdate, id: number): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .update(campaign)
      .eq('id', id)

    if (error) throw createError(error)
  }

  async function getJoinCampaignToken(token: string): Promise<JoinCampaignItem> {
    const { data, error } = await supabase
      .from('join_campaign')
      .select(`
        *,
        user(id, username, avatar),
        campaign(title, id)
      `)
      .eq('token', token)
      .returns<JoinCampaignKey>()
      .single()

    if (error) throw createError(error)
    else return data
  }

  async function addJoinCampaignToken(join: JoinCampaignInsert): Promise<JoinCampaignKey> {
    const { data, error } = await supabase
      .from('join_campaign')
      .insert([join])
      .select(`
        *,
        user(id, username, avatar)
      `)
      .returns<JoinCampaignKey>()

    if (error) throw createError(error)
    else return data
    // if (data && campaign.value) {
    //   campaign.value.join_campaign?.push(data[0] as JoinCampaign)
    // }
  }

  async function deleteJoinCampaignToken(id: number): Promise<void> {
    const { error } = await supabase
      .from('join_campaign')
      .delete()
      .eq('id', id)

    if (error) throw createError(error)

    // if (campaign.value?.join_campaign) {
    //   campaign.value.join_campaign = campaign.value.join_campaign.filter(h => h.id !== id)
    // }
  }

  async function addCampaignTeamMember(member: TeamInsert, id?: number): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team')
      .insert([member])
      .select(`
        id,
        role,
        user(id, username, avatar)
      `)
      .returns<TeamMember>()

    if (error) throw createError(error)

    if (id) await deleteJoinCampaignToken(id)

    return data

    // if (data && campaign.value) {
    //   campaign.value.team?.push(data[0] as TeamMember)
    // }
  }

  async function deleteCampaignTeamMember(id: number): Promise<void> {
    const { error } = await supabase
      .from('team')
      .delete()
      .eq('id', id)

    if (error) throw createError(error)

    // if (campaign.value?.team) {
    //   campaign.value.team = campaign.value.team.filter(h => h.id !== id)
    // }
  }

  async function updateCampaignTeamMember(member: TeamUpdate, id: number): Promise<void> {
    const { error } = await supabase
      .from('team')
      .update(member as never)
      .eq('id', id)

    if (error) throw createError(error)

    // if (campaign.value?.team) {
    //   const index = campaign.value.team.findIndex(e => e.id === id)

    //   campaign.value.team[index] = {
    //     ...campaign.value.team[index],
    //     ...member,
    //   }
    // }
  }

  return {
    max,
    amount,
    pages,
    perPage,
    get,
    getCount,
    getCampaignById,
    getCampaignsMinimal,
    getCampaignMinimalById,
    addCampaign,
    deleteCampaign,
    updateCampaign,
    getJoinCampaignToken,
    addJoinCampaignToken,
    deleteJoinCampaignToken,
    addCampaignTeamMember,
    deleteCampaignTeamMember,
    updateCampaignTeamMember,
  }
})
