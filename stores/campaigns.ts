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

  async function fetch(filter: SbFilter): Promise<CampaignItem[] | undefined> {
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

  async function fetchCount(): Promise<number> {
    const { count } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })

    return count || 0
  }

  async function getCampaignById(id: number): Promise<CampaignRow> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *, 
        created_by(id, username, avatar, email, badges), 
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

  return {
    max,
    amount,
    pages,
    perPage,
    fetch,
    fetchCount,
    getCampaignById,
    getCampaignsMinimal,
    getCampaignMinimalById,
    addCampaign,
    deleteCampaign,
    updateCampaign,
  }
})
