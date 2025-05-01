import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

export function useEncounterListing(
  data: ComputedRef<SbFilter>,
  enabled: ComputedRef<boolean>,
  perPage = 10,
) {
  return useQuery({
    queryKey: ['useEncounterListing', data, perPage],
    queryFn: () => sbQuery<EncounterItem>({
      table: 'initiative_sheets',
      select: `
        *, 
        created_by(id, username, avatar),
        campaign( 
          id,
          title,
          created_by(id, username, avatar), 
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
      encounters: data?.map(encounter => ({
        ...encounter,
        homebrew_items: sbCount('homebrew_items', encounter),
        initiative_sheets: sbCount('initiative_sheets', encounter),
      })),
    }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useEncounterCount(enabled: ComputedRef<boolean>) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: ['useEncounterCount'],
    queryFn: async () => await supabase.from('initiative_sheets').select('id', { count: 'exact' }),
    select: ({ count }) => count || 0,
    enabled,
  })
}

export function useEncounterCreate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.encounter').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: InitiativeInsert } & QueryDefaults) => {
      const { error } = await supabase.from('initiative_sheets').insert([data])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
      queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })

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

export function useEncounterUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.encounter').toLowerCase()

  return useMutation({
    mutationFn: async ({ data, id }: { data: Omit<InitiativeUpdate, NotUpdatable>, id: number } & QueryDefaults) => {
      const { error } = await supabase.from('initiative_sheets').update(data).eq('id', id)

      if (error) throw createError(error)
    },
    onSuccess: (_data, { id, onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
      queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })

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

export function useEncounterRemove() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.encounter').toLowerCase()

  return useMutation({
    mutationFn: async ({ id }: { id: number | number[] } & QueryDefaults) => {
      let query = supabase.from('initiative_sheets').delete()

      query = Array.isArray(id)
        ? query.in('id', id)
        : query.eq('id', id)

      const { error } = await query

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
      queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })

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

export function useEncounterCopy() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const type = t('general.encounter').toLowerCase()

  return useMutation({
    mutationFn: async ({ data }: { data: EncounterItem } & QueryDefaults) => {
      const { campaign, created_by, id, homebrew_items, initiative_sheets, ...enc } = data

      const { error } = await supabase.from('initiative_sheets').insert([{
        ...enc,
        created_by: created_by.id,
        title: `copy ${enc.title}`.slice(0, 30),
        ...(campaign && { campaign: campaign.id }),
      }])

      if (error) throw createError(error)
    },
    onSuccess: (_data, { onSuccess }) => {
      if (onSuccess) onSuccess()

      queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
      queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })

      toast({
        description: t('components.toast.copy.success', { type }),
        variant: 'success',
      })
    },
    onError: (error, { onError }) => {
      if (onError) onError(error.message)

      toast({
        title: t('general.error.title'),
        description: t('components.toast.copy.error', { type }),
        variant: 'destructive',
      })
    },
    onSettled: (_data, error, { onSettled }) => {
      if (onSettled) onSettled(error?.message)
    },
  })
}
