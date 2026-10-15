import { useMutation, useQuery } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

interface NameFilters {
  amount: number
  race: DndRace | 'random'
  gender: DndGender | 'random'
}

function nameQuery({ amount, race, gender }: NameFilters) {
  return {
    amount,
    ...(race === 'random' ? {} : { race }),
    ...(gender === 'random' ? {} : { gender }),
  }
}

export function useRandomNames(data: ComputedRef<NameFilters>) {
  const { t } = useI18n()

  return useQuery({
    queryKey: queryKeys.randomNames(data),
    queryFn: async () => {
      try {
        return await $fetch<string[]>('/api/names', {
          query: nameQuery(data.value),
        })
      } catch (error) {
        toast.error(t('general.error.loadFailed.names'), {
          description: t(`general.error.reasons.${getFailureReason(error)}`),
        })

        throw error
      }
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useRandomName() {
  const { t } = useI18n()

  return useMutation({
    mutationFn: async (): Promise<string | undefined> => {
      const [name] = await $fetch<string[]>('/api/names')

      return name
    },
    onError: error => {
      toast.error(t('general.error.loadFailed.names'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
