import { useMutation, useQuery } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast'

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
  const { toast } = useToast()
  const { t } = useI18n()

  return useQuery({
    queryKey: ['useRandomNames', data],
    queryFn: async () => {
      try {
        return await $fetch<string[]>('/api/names', {
          query: nameQuery(data.value),
        })
      } catch (error) {
        toast({
          title: t('general.error.title'),
          description: getErrorMessage(error),
          variant: 'destructive',
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
  const { toast } = useToast()
  const { t } = useI18n()

  return useMutation({
    mutationFn: async (): Promise<string | undefined> => {
      const [name] = await $fetch<string[]>('/api/names')

      return name
    },
    onError: error => {
      toast({
        title: t('general.error.title'),
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    },
  })
}
