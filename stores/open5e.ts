export const useOpen5e = defineStore('useOpen5e', () => {
  const toast = useToast()
  const { t } = useI18n()

  const isLoading = ref<boolean>(true)
  const hits = ref<Open5eItem[]>([])
  const sortBy = ref<Open5eSortBy>('name')
  const type = ref<Open5eType>('spells')
  const pages = ref<number>(0)
  const page = ref<number>(0)
  const limit = ref<number>(20)
  const search = ref<string>('')
  const cr = ref<string>()

  watchDebounced(
    [type, search, sortBy, page, limit, cr],
    (newValue, oldValue) => {
      const [newSearch, newType] = newValue
      const [oldSearch, oldType] = oldValue

      if (newSearch !== oldSearch) page.value = 0

      if (newType !== oldType) {
        sortBy.value = 'name'
        page.value = 0
      }

      fetch()
    },
    { debounce: 500, maxWait: 1000 },
  )

  async function fetch(filters?: Open5eFilters): Promise<void> {
    isLoading.value = true

    const queryFilters: Open5eFilters = {
      limit: limit.value,
      page: page.value,
      search: search.value,
      cr: cr.value,
      ordering: type.value === 'monsters' ? sortBy.value : 'name',
      document__slug: 'wotc-srd',
    }

    try {
      const query = generateParams(
        removeEmptyKeys<Open5eFilters>({
          ...(filters || queryFilters),
          page: (filters?.page || queryFilters.page) + 1, // Open5e uses 1-based indexing
        }),
      )

      const url = `https://api.open5e.com/${type.value}/?${query}`

      const data = await $fetch<Open5eResponse>(url)

      if (data) {
        pages.value = Math.ceil(data.count / (filters?.limit || queryFilters.limit))
        hits.value = data.results
      }
    }
    catch (err: any) {
      toast.error({ text: err.message })
    }
    finally {
      isLoading.value = false
    }
  }

  function paginate(newPage: number): void {
    page.value = newPage

    const el = document.getElementById('el')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  function reset(resetType: Open5eType): void {
    isLoading.value = true
    sortBy.value = 'name'
    hits.value = []
    pages.value = 0
    type.value = resetType
    limit.value = 20
    page.value = 0
    search.value = ''
    cr.value = undefined

    fetch()
  }

  const options: Option<Open5eType>[] = [
    { value: 'spells', label: t('general.spells') },
    { value: 'conditions', label: t('general.conditions') },
    { value: 'magicitems', label: t('general.magicitems') },
    { value: 'weapons', label: t('general.weapons') },
    { value: 'armor', label: t('general.armor') },
    { value: 'sections', label: t('general.sections') },
  ]

  return {
    options,
    isLoading,
    hits,
    pages,
    sortBy,
    type,
    page,
    limit,
    search,
    cr,
    fetch,
    paginate,
    reset,
  }
})
