import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

export function useEncounterListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: queryKeys.encounterListing(data, perPage),
    queryFn: () =>
      sbQuery<EncounterItem>({
        table: 'initiative_sheets',
        select: `
        *, 
        createdBy(id, username, avatar),
        campaign( 
          id,
          title,
          createdBy(id, username, avatar, subscriptionType), 
          team(
            id,
            user(id, username, avatar),
            role
          )
        )
      `,
        filters: data.value,
        page: data.value.page,
        perPage,
        fuzzy: true,
      }),
    select: ({ data, count, totalPages }) => ({
      amount: count,
      pages: totalPages,
      encounters: data ?? undefined,
    }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useEncounterCount(enabled: ComputedRef<boolean>) {
  const supabase = useSupabaseClient<DB>()
  const user = useAuthenticatedUser()

  return useQuery({
    queryKey: queryKeys.encounterCount(user.value.id),
    queryFn: async () =>
      await supabase
        .from('initiative_sheets')
        .select('*', { count: 'exact', head: true })
        .eq('createdBy', user.value.id),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useEncounterCreate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.encounter',
    action: 'create',
    mutationFn: async ({
      data,
    }: { data: InitiativeInsert } & QueryDefaults) => {
      const { error } = await supabase.from('initiative_sheets').insert([data])

      if (error) throw createError(error)
    },
    invalidate: () => [
      queryKeys.encounterListing(),
      queryKeys.encounterCount(),
    ],
  })
}

export function useEncounterUpdate() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.encounter',
    action: 'update',
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<InitiativeUpdate, NotUpdatable>
      id: number
    } & QueryDefaults) => {
      const { error } = await supabase
        .from('initiative_sheets')
        .update(data)
        .eq('id', id)

      if (error) throw createError(error)
    },
    invalidate: () => [
      queryKeys.encounterListing(),
      queryKeys.encounterCount(),
    ],
  })
}

export function useEncounterRemove() {
  return useCrudMutation({
    type: 'general.encounter',
    action: 'delete',
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      await Promise.all(
        toArray(id).map(single =>
          $fetch(`/api/encounter/${single}`, { method: 'DELETE' }),
        ),
      )
    },
    invalidate: () => [
      queryKeys.encounterListing(),
      queryKeys.encounterCount(),
    ],
  })
}

export function useEncounterCopy() {
  const supabase = useSupabaseClient<DB>()

  return useCrudMutation({
    type: 'general.encounter',
    action: 'copy',
    mutationFn: async ({ data }: { data: EncounterItem } & QueryDefaults) => {
      const { campaign, createdBy, id, ...enc } = data

      const { error } = await supabase.from('initiative_sheets').insert([
        {
          ...enc,
          createdBy: createdBy.id,
          title: `copy ${enc.title}`.slice(0, 30),
          ...(campaign && { campaign: campaign.id }),
        },
      ])

      if (error) throw createError(error)
    },
    invalidate: () => [
      queryKeys.encounterListing(),
      queryKeys.encounterCount(),
    ],
  })
}

export function useEncounterImport() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      data,
    }: { data: InitiativeInsert[] } & QueryDefaults) => {
      const { error } = await supabase.from('initiative_sheets').insert(data)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { data }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.encounterListing() })
      queryClient.invalidateQueries({ queryKey: queryKeys.encounterCount() })

      toast.success(
        t('components.toast.import.success', {
          count: data.length,
          type: t('general.encounter', data.length).toLowerCase(),
        }),
      )
    },
    onError: error => {
      toast.error(
        t('components.toast.import.error', {
          type: t('general.encounter', 2).toLowerCase(),
        }),
        { description: t(`general.error.reasons.${getFailureReason(error)}`) },
      )
    },
  })
}
