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

  async function get(filter: SbFilter): Promise<EncounterItem[] | undefined> {
    const { data, count, totalPages } = await sbQuery<EncounterItem>({
      table: 'initiative_sheets',
      page: filter.page,
      filters: filter,
      perPage: perPage.value,
      select,
      fuzzy: true,
    })

    amount.value = count
    pages.value = totalPages

    return data
  }

  async function getCount(): Promise<number> {
    const { count } = await supabase
      .from('initiative_sheets')
      .select('id', { count: 'exact' })

    return count || 0
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

  async function copyEncounter(item: EncounterItem): Promise<void> {
    if (!profile.user) return

    const { campaign, created_by, id, ...enc } = item

    const encounter: InitiativeInsert = {
      ...enc,
      created_by: created_by.id,
      title: `copy ${enc.title}`.slice(0, 30),
      ...(campaign && { campaign: campaign.id }),
    }

    await addEncounter(encounter)
  }

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

  return {
    amount,
    max,
    pages,
    perPage,
    get,
    getCount,
    getEncountersByCampaign,
    addEncounter,
    copyEncounter,
    deleteEncounter,
    updateEncounter,
  }
})
