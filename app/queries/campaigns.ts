import { keepPreviousData, useQuery } from '@tanstack/vue-query'

export function useCampaignDetail(id: number) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.campaignDetail(id),
    queryFn: async () =>
      await supabase
        .from('campaigns')
        .select(
          `
        *, 
        createdBy(id, username, avatar, name, email, subscriptionType), 
        team(
          id,
          role,
          user(id, username, avatar, name, email, subscriptionType)
        ), 
        join_campaign(
          id,
          role,
          user(id, username, avatar, name, email, subscriptionType)
        )
      `,
        )
        .eq('id', id)
        .single(),
    select: ({ data, error }) => {
      if (error) throw createError(error)
      else return data
    },
  })
}

export function useCampaignListing(data: ComputedRef<SbFilter>) {
  return useQuery({
    queryKey: queryKeys.campaignListing(data),
    queryFn: () =>
      sbQuery<CampaignItem>({
        table: 'campaigns',
        select: `
        *,
        createdBy(id, username, avatar, subscriptionType),
        initiative_sheets(count),
        homebrew_items(count),
        team(
          id,
          role,
          user(id, username, avatar)
        ),
        join_campaign(user)
      `,
        filters: data.value,
        page: data.value.page,
        perPage: 10,
        fuzzy: true,
      }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      campaigns: data?.map(campaign => ({
        ...campaign,
        homebrew_items: sbCount('homebrew_items', campaign),
        initiative_sheets: sbCount('initiative_sheets', campaign),
      })),
    }),
    placeholderData: keepPreviousData,
  })
}

export function useCampaignMinimalListing(id: string) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.campaignMinimal(id),
    queryFn: async () =>
      await supabase.from('campaigns').select(`
        id,
        title,
        createdBy(id, username, avatar),
        team(
          id,
          role,
          user(id, username, avatar)
        )
      `),
    select: ({ data, error }) => {
      if (error) throw createError(error)
      else
        return data.filter(campaign => {
          if (
            campaign.createdBy.id === id ||
            campaign.team.find(u => u.user.id === id && u.role !== 'Viewer')
          )
            return true
        })
    },
  })
}

export function useCampaignCount() {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.campaignCount(),
    queryFn: async () =>
      await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true }),
    select: ({ count }) => count || 0,
  })
}

export function useCampaignCreate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.campaign',
    action: 'create',
    mutationFn: async ({ data }: { data: CampaignInsert } & QueryDefaults) => {
      const { error } = await supabase.from('campaigns').insert([data])

      if (error) throw createError(error)
    },
    invalidate: () => [
      queryKeys.campaignListing(),
      queryKeys.campaignCount(),
      queryKeys.campaignMinimal(),
    ],
  })
}

export function useCampaignUpdate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.campaign',
    action: 'update',
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<CampaignUpdate, NotUpdatable>
      id: number
    } & QueryDefaults) => {
      const { error } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)

      if (error) throw createError(error)
    },
    invalidate: ({ id }) => [
      queryKeys.campaignListing(),
      queryKeys.campaignCount(),
      queryKeys.campaignMinimal(),
      queryKeys.campaignDetail(id),
    ],
  })
}

export function useCampaignRemove() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.campaign',
    action: 'delete',
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('campaigns').delete()

      query = Array.isArray(id) ? query.in('id', id) : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    invalidate: ({ id }) => [
      queryKeys.campaignListing(),
      queryKeys.campaignCount(),
      queryKeys.campaignMinimal(),
      ...toArray(id).map(campaign => queryKeys.campaignDetail(campaign)),
    ],
    remove: ({ id }) =>
      toArray(id).map(campaign => queryKeys.campaignMember(campaign)),
  })
}
