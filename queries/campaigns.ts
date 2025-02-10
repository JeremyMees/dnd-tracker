import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useCampaignDetail(id: number) {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useCampaignDetail', id],
    queryFn: async () => await supabase
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
      .single(),
    select: ({ data, error }) => {
      if (error) throw createError(error)
      else return data
    },
  })
}

export function useCampaignListing(data: ComputedRef<SbFilter>) {
  return useQuery({
    queryKey: ['useCampaignListing', data],
    queryFn: () => sbQuery<CampaignItem>({
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
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useCampaignMinimal'],
    queryFn: async () => await supabase
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
      `),
    select: ({ data, error }) => {
      if (error) throw createError(error)
      else return data.filter((campaign) => {
        if (
          campaign.created_by.id === id
          || campaign.team.find(u => u.user.id === id && u.role !== 'Viewer')
        ) return true
      })
    },
  })
}

export function useCampaignMinimalDetail(id?: number) {
  const supabase = useSupabaseClient<Database>()

  if (!id) return

  return useQuery({
    queryKey: ['useCampaignMinimalDetail', id],
    queryFn: async () => await supabase
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
      .single(),
    select: ({ data, error }) => {
      if (error) throw createError(error)
      else return data
    },
  })
}

export function useCampaignCount() {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['useCampaignCount'],
    queryFn: async () => await supabase.from('campaigns').select('id', { count: 'exact' }),
    select: ({ count }) => count || 0,
  })
}

export function useCampaignCreate() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.campaign').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: CampaignInsert } & QueryDefaults) => {
      const { error } = await supabase.from('campaigns').insert([data])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignCount'] })

      toast({
        description: t('components.toast.create.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.create.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useCampaignUpdate() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.campaign').toLowerCase()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<CampaignUpdate, NotUpdatable>, id: number } & QueryDefaults) => {
      const { error } = await supabase.from('campaigns').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignCount'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', id] })

      toast({
        description: t('components.toast.update.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.update.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useCampaignRemove() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.campaign').toLowerCase()

  return useMutation({
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('campaigns').delete()

      query = Array.isArray(id)
        ? query.in('id', id)
        : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignCount'] })
      if (Array.isArray(id)) id.forEach(id => queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', id] }))
      else queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', id] })

      toast({
        title: t('components.toast.delete.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.delete.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
