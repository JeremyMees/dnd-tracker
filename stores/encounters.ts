export const useEncounters = defineStore('useEncounters', () => {
  const supabase = useSupabaseClient<Database>()
  const profile = useProfile()

  const amount = ref<number>(0)
  const pages = ref<number>(0)
  const perPage = ref<number>(10)

  const max = computed<number>(() => getMax(
    'encounter',
    profile.data?.subscription_type || 'free',
  ))

  const select = `
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
  `

  async function fetch(filter: SbFilter, eq?: SbEq, fuzzy: boolean = false): Promise<EncounterItem[] | undefined> {
    try {
      const { data, count, totalPages } = await sbQuery<EncounterItem>({
        table: 'initiative_sheets',
        page: filter.page,
        filters: filter,
        perPage: perPage.value,
        select,
        eq,
        fuzzy,
      })

      amount.value = count
      pages.value = totalPages

      return data
    }
    catch (err) {
      console.error(err)
    }
  }

  async function getEncountersByCampaign(id: number): Promise<EncounterItem[] | undefined> {
    const { data, error } = await supabase
      .from('initiative_sheets')
      .select(select)
      .eq('campaign', id)
      .returns<EncounterItem[]>()

    if (error) createError(error)
    else return data
  }

  async function addEncounter(encounter: InitiativeInsert): Promise<void> {
    const { error } = await supabase
      .from('initiative_sheets')
      .insert([encounter])

    if (error) throw createError(error)
  }

  // async function copyEncounter({ created_at, id, profiles, ...enc }: Encounter): Promise<Encounter | undefined> {
  //   if (!profile.data) {
  //     return
  //   }

  //   let encounter: UpdateEncounter = {
  //     ...enc,
  //     title: `copy ${enc.title}`.slice(0, 30),
  //     created_by: profile.data.id,
  //     campaign: undefined,
  //   }

  //   if (enc.campaign) {
  //     encounter = {
  //       ...encounter,
  //       campaign: enc.campaign.id,
  //     }
  //   }

  //   return await addEncounter(encounter as AddEncounter)
  // }

  async function deleteEncounter(id: number | number[]): Promise<void> {
    let query = supabase.from('initiative_sheets').delete()

    query = Array.isArray(id)
      ? query.in('id', id)
      : query.eq('id', id)

    const { error } = await query

    if (error) throw createError(error)
  }

  async function updateEncounter(encounter: InitiativeUpdate, id: number): Promise<void> {
    const { error } = await supabase
      .from('initiative_sheets')
      .update(encounter)
      .eq('id', id)

    if (error) throw createError(error)
  }

  // function shareEncounter(encounter: Encounter): void {
  //   try {
  //     const content = window.btoa(encodeURIComponent(encounter.id))
  //     const url = `https://dnd-tracker.com${locale.value === 'en' ? '/en/' : '/'}playground?content=${content}`

  //     copy(url)

  //     toast.info({
  //       title: t('actions.copyClipboard'),
  //       timeout: 2000,
  //     })
  //   }
  //   catch (err) {
  //     toast.error()
  //   }
  // }

  // function resetPagination(): void {
  //   pages.value = 0
  //   page.value = 0
  //   filters.value = {
  //     search: '',
  //     sortedBy: 'id',
  //     sortACS: true,
  //   }
  // }

  return {
    // loading,
    // searching,
    // error,
    // data,
    // restrictionEncounters,
    amount,
    max,
    pages,
    // page,
    perPage,
    // filters,
    // encounterCount,
    // noItems,
    fetch,
    getEncountersByCampaign,
    addEncounter,
    // copyEncounter,
    deleteEncounter,
    updateEncounter,
    // shareEncounter,
    // resetPagination,
  }
})
