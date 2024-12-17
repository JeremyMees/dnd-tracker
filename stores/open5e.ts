export const useOpen5e = defineStore('useOpen5e', () => {
  const toast = useToast()
  const { t } = useI18n()

  const pages = ref<number>(0)

  async function get(type: Open5eType, filters: Open5eFilters): Promise<Open5eItem[] | undefined> {
    const queryFilters: Open5eFilters = {
      ...filters,
      page: filters.page + 1, // Open5e uses 1-based indexing
      document__slug: 'wotc-srd',
    }

    try {
      const query = generateParams(
        removeEmptyKeys<Open5eFilters>(queryFilters),
      )

      const url = `https://api.open5e.com/${type}/?${query}`

      const data = await $fetch<Open5eResponse>(url)

      if (data) {
        pages.value = Math.ceil(data.count / (filters?.limit || queryFilters.limit))
        return data.results
      }
    }
    catch (err: any) {
      toast.error({ text: err.message })
    }
  }

  const options: Option<Open5eType>[] = [
    { value: 'spells', label: t('general.spell', 2) },
    { value: 'conditions', label: t('general.condition', 2) },
    { value: 'magicitems', label: t('general.magicItem', 2) },
    { value: 'weapons', label: t('general.weapon', 2) },
    { value: 'armor', label: t('general.armor') },
    { value: 'sections', label: t('general.section', 2) },
  ]

  return {
    options,
    pages,
    get,
  }
})
