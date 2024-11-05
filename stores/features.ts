export const useFeatures = defineStore('useFeatures', () => {
  const supabase = useSupabaseClient<Database>()
  const profile = useProfile()
  const toast = useToast()

  const loading = ref<boolean>(true)
  const data = ref<FeatureRequest[]>()
  const sortBy = ref<FeatureSortBy>('first_new')
  const createdBy = ref<FeatureType>('all')
  const search = ref<string>()

  const activeFilters = computed<boolean>(() => !!search.value || createdBy.value !== 'all')

  const sortedFeatures = computed<FeatureRequest[]>(() => {
    if (data.value) {
      let features = data.value

      if (search.value) {
        features = features.filter((f) => {
          return f.title.toLowerCase().includes(search.value?.toLowerCase().trim() || '')
        })
      }

      if (createdBy.value === 'my' && profile.data) {
        features = features.filter(f => f.created_by.id === profile.data!.id)
      }

      switch (sortBy.value) {
        case 'first_new':
          return features.sort((a, b) => b.created_at.localeCompare(a.created_at))
        case 'first_old':
          return features.sort((a, b) => a.created_at.localeCompare(b.created_at))
        case 'voted_most':
          return features.sort((a, b) => {
            const aTotal = a.voted.like.length + a.voted.dislike.length
            const bTotal = b.voted.like.length + b.voted.dislike.length
            return bTotal - aTotal
          })
        case 'voted_least':
          return features.sort((a, b) => {
            const aTotal = a.voted.like.length + a.voted.dislike.length
            const bTotal = b.voted.like.length + b.voted.dislike.length
            return aTotal - bTotal
          })
      }
    }
    else {
      return []
    }
  })

  async function fetch(): Promise<void> {
    loading.value = true

    try {
      const { data: results, error: err } = await supabase
        .from('features')
        .select('*, created_by(id, created_at, username, name, avatar, email, badges)')
        .returns<FeatureRequest[]>()

      if (err) throw createError(err.message)

      data.value = results
    }
    catch (err: any) {
      toast.error({ text: err.message })
    }
    finally {
      loading.value = false
    }
  }

  async function addFeature(feature: FeatureInsert): Promise<undefined | FeatureRequest> {
    const { data: results, error: err } = await supabase
      .from('features')
      .insert([feature])
      .select('*, created_by(id, created_at, username, name, avatar, email, badges)')
      .returns<FeatureRequest[]>()

    if (err) throw createError(err.message)

    if (results) {
      if (data.value) data.value.push(results[0])
      else data.value = [results[0]]

      return results[0]
    }
  }

  async function vote(id: number, votes: FeatureVotes): Promise<void> {
    try {
      const { data: results, error: err } = await supabase
        .from('features')
        .update({ voted: votes } as never)
        .eq('id', id)
        .select('*, created_by(id, created_at, username, name, avatar, email, badges)')
        .returns<FeatureRequest[]>()

      if (err) throw createError(err.message)

      if (results?.length) {
        const index = data.value?.findIndex(f => f.id === results[0].id)

        if (index !== undefined && data.value) {
          data.value[index] = results[0]
        }
      }
    }
    catch (err: any) {
      toast.error({ text: err.message })
    }
  }

  onMounted(() => fetch())

  return {
    loading,
    data,
    sortBy,
    sortedFeatures,
    search,
    createdBy,
    activeFilters,
    vote,
    addFeature,
  }
})
