import { useToast } from '~/components/ui/toast/use-toast'

export const useFeatures = defineStore('useFeatures', () => {
  const supabase = useSupabaseClient<Database>()
  const { toast } = useToast()
  const { t } = useI18n()

  const amount = ref<number>(0)
  const pages = ref<number>(0)
  const perPage = ref<number>(10)

  async function get(filter: SbFilter, eq?: SbEq): Promise<FeatureRequest[] | undefined> {
    try {
      const { data, count, totalPages } = await sbQuery<FeatureRequest>({
        table: 'features',
        select: '*, created_by(id, avatar, username)',
        filters: filter,
        page: filter.page,
        perPage: perPage.value,
        fuzzy: true,
        ...(eq && { eq }),
      })

      amount.value = count
      pages.value = totalPages

      return data
    }
    catch (err) {
      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    }
  }

  async function addFeature(feature: FeatureInsert): Promise<void> {
    const { error } = await supabase
      .from('features')
      .insert([feature])

    if (error) throw createError(error.message)
  }

  async function vote(id: number, votes: FeatureVotes): Promise<void> {
    try {
      const { error } = await supabase
        .from('features')
        .update({ voted: votes } as never)
        .eq('id', id)

      if (error) throw createError(error.message)
    }
    catch (err) {
      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    }
  }

  return {
    amount,
    pages,
    perPage,
    get,
    vote,
    addFeature,
  }
})
