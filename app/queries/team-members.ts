import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

function refreshCampaignTeam(queryClient: QueryClient, campaign: number): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.campaignDetail(campaign),
  })
  void queryClient.invalidateQueries({ queryKey: queryKeys.campaignListing() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.campaignMinimal() })
  queryClient.removeQueries({ queryKey: queryKeys.campaignMember(campaign) })
}

export function useJoinTokenRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaignDetail(campaign),
      })
    },
    onError: error => {
      toast.error(t('general.error.failed.inviteRevoke'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
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
      refreshCampaignTeam(queryClient, campaign)
    },
  })
}

export function useTeamMemberRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      member,
    }: { member: number; campaign: number } & QueryDefaults) => {
      const { error } = await supabase.from('team').delete().eq('id', member)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign }) => {
      refreshCampaignTeam(queryClient, campaign)
    },
    onError: error => {
      toast.error(t('general.error.failed.memberRemove'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}

export function useCampaignLeave() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const user = useAuthenticatedUser()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({ campaign }: { campaign: number } & QueryDefaults) => {
      const { error } = await supabase
        .from('team')
        .delete()
        .match({ campaign, user: user.value.id })

      if (error) throw createError(error)
    },
    onSuccess: (_data, { campaign }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaignListing(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaignMinimal(),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.campaignDetail(campaign),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.campaignMember(campaign),
      })
    },
    onError: error => {
      toast.error(t('general.error.failed.memberRemove'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
