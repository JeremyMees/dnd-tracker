import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export function useJoinTokenCreate() {
  const supabase = useSupabaseClient<DB>()

  return useMutation({
    mutationFn: async ({ data }: { data: TeamInsert } & QueryDefaults) => {
      const jwt = await $fetch<string>('/api/campaign/join', {
        method: 'POST',
        body: data,
      })

      if (!jwt) throw createError('Failed to create join token')

      const { error } = await supabase
        .from('join_campaign')
        .insert([{ ...data, token: jwt }])
        .select(`
          *,
          user(id, username, avatar)
        `)

      if (error) throw createError(error)
      else return jwt
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useJoinTokenRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number, campaign: number } & QueryDefaults) => {
      const { error } = await supabase.from('join_campaign').delete().eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', campaign] })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useTeamMemberCreate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, id }: { data: TeamInsert, id?: number } & QueryDefaults) => {
      const { error } = await supabase.from('team').insert([data])

      if (error) throw createError(error)

      if (id) await supabase.from('join_campaign').delete().eq('id', id)
    },
    onSuccess: (_data, { data, onSuccess }) => {
      queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', data.campaign] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })

      if (onSuccess) onSuccess()
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useTeamMemberUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<TeamUpdate, NotUpdatable>, id: number, campaign: number } & QueryDefaults) => {
      const { error } = await supabase.from('team').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign, onSuccess }) => {
      queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', campaign] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })

      if (onSuccess) onSuccess()
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}

export function useTeamMemberRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  return useMutation({
    mutationFn: async ({ member }: { member: number, campaign: number } & QueryDefaults) => {
      const { error } = await supabase.from('team').delete().eq('id', member)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign, onSuccess }) => {
      queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', campaign] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })

      if (onSuccess) onSuccess()
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
