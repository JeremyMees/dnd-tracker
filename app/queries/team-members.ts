import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export function useJoinTokenRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      id,
    }: { id: number; campaign: number } & QueryDefaults) => {
      const { error } = await supabase
        .from('join_campaign')
        .delete()
        .eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign }) => {
      queryClient.invalidateQueries({
        queryKey: ['useCampaignDetail', campaign],
      })
    },
    onError: error => {
      toast({
        title: t('general.error.failed.inviteRevoke'),
        description: t(`general.error.reasons.${getFailureReason(error)}`),
        variant: 'destructive',
      })
    },
  })
}

export function useTeamMemberUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  return useCallbackMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<TeamUpdate, NotUpdatable>
      id: number
      campaign: number
    } & QueryDefaults) => {
      const { error } = await supabase.from('team').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign }) => {
      queryClient.invalidateQueries({
        queryKey: ['useCampaignDetail', campaign],
      })
      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignMinimal'] })
      queryClient.removeQueries({ queryKey: ['useCampaignMember', campaign] })
    },
  })
}

export function useTeamMemberRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      member,
    }: { member: number; campaign: number } & QueryDefaults) => {
      const { error } = await supabase.from('team').delete().eq('id', member)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign }) => {
      queryClient.invalidateQueries({
        queryKey: ['useCampaignDetail', campaign],
      })
      queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
      queryClient.invalidateQueries({ queryKey: ['useCampaignMinimal'] })
      queryClient.removeQueries({ queryKey: ['useCampaignMember', campaign] })
    },
    onError: error => {
      toast({
        title: t('general.error.failed.memberRemove'),
        description: t(`general.error.reasons.${getFailureReason(error)}`),
        variant: 'destructive',
      })
    },
  })
}
