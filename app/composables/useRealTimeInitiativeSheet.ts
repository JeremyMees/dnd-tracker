import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

export type UpdateInitiativeSheetData = Omit<
  Partial<InitiativeSheet>,
  NotUpdatable | 'campaign'
>

export function useRealTimeInitiativeSheet(
  id: number,
  data: Ref<InitiativeSheet | undefined>,
) {
  const user = useAuthenticatedUser()
  const { toast } = useToast()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()

  const channel = supabase.channel('initiative_sheets')

  const enabled = computed(() => {
    if (!data.value) return false

    return isPro(user.value) && !!data.value.campaign
  })

  function updateQueryData(payload: UpdateInitiativeSheetData): void {
    queryClient.setQueryData(
      ['useInitiativeSheetDetail', id],
      (old: InitiativeSheet) => {
        if (!old) return old

        return {
          ...old,
          ...payload,
          ...(old?.campaign ? { campaign: old.campaign } : {}),
        }
      },
    )
  }

  onMounted(() => {
    if (!enabled.value) return

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative_sheets',
          filter: `id=eq.${id}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            toast({
              title: t('pages.encounter.toasts.removed.title'),
              description: t('pages.encounter.toasts.removed.text'),
              variant: 'warning',
            })

            navigateTo(localePath('/encounters'))
          } else if (payload.new && Object.keys(payload.new).length > 0) {
            updateQueryData(payload.new)
          }
        },
      )
      .subscribe()
  })

  onBeforeUnmount(() => {
    channel.unsubscribe()
    supabase.removeChannel(channel)
  })

  return {
    enabled,
    updateQueryData,
  }
}
