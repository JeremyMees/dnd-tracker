export const useCampaigns = defineStore('useCampaigns', () => {
  const supabase = useSupabaseClient<Database>()
  const profile = useProfile()
  const toast = useToast()

  const campaigns = ref<CampaignRow[]>()
  const loading = ref<boolean>(true)
  const error = ref<string>()

  const max = computed<number>(() => getMax('campaign', profile.data?.subscription_type || 'free'))

  const allowedCampaigns = computed<CampaignRow[] | undefined>(() => {
    if (!profile.data || !campaigns.value) return

    // const { userArr, nonUserArr } = sortCampaignsByCreatedAt(campaigns.value, profile.data.id)

    // return [...userArr.splice(0, max.value), ...nonUserArr]
    return []
  })

  async function fetch(filter: SbFilter): Promise<CampaignItem[] | null> {
    const { data } = await supabase
      .from('campaigns')
      .select(`
          *,
          created_by(id, username, avatar),
          initiative_sheets(count),
          homebrew_items(count),
          team(
            id,
            role,
            user(id, username, avatar)
          )
        `)
      .order(filter.sortedBy, { ascending: filter.sortACS })
      .returns<CampaignItem[]>()

    return data?.map(campaign => ({
      ...campaign,
      homebrew_items: sbCount('homebrew_items', data),
      initiative_sheets: sbCount('initiative_sheets', data),
    })) || null
  }

  async function getCampaignById(id: number): Promise<CampaignRow> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *, 
        created_by(id, created_at, username, name, avatar, email, badges), 
        team(
          id,
          role,
          user(id, created_at, username, name, avatar, email, badges)
        ), 
        join_campaign(
          id,
          role,
          user(id, created_at, username, name, avatar, email, badges)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }
    else {
      return data
    }
  }

  async function addCampaign(campaign: CampaignInsert): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .insert([campaign])

    if (error) {
      throw error
    }
    else {
      // fetch()
    }
  }

  async function deleteCampaign(id: number | number[]): Promise<void> {
    try {
      let query = supabase.from('campaigns').delete()

      query = Array.isArray(id)
        ? query.in('id', id)
        : query.eq('id', id)

      const { error: err } = await query

      if (err) {
        throw err
      }
      else {
        // fetch()
      }
    }
    catch (err) {
      console.error(err)
      toast.error()
    }
  }

  async function updateCampaign(campaign: CampaignUpdate, id: number): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .update(campaign as never)
      .eq('id', id)

    if (error) {
      throw error
    }
    else {
      // fetch()
    }
  }

  return {
    loading,
    error,
    campaigns,
    allowedCampaigns,
    max,
    fetch,
    getCampaignById,
    addCampaign,
    deleteCampaign,
    updateCampaign,
  }
})
