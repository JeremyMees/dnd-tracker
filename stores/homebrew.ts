import homebrewExamples from '~/constants/homebrew-examples.json'

export const useHomebrews = defineStore('useHomebrews', () => {
  const supabase = useSupabaseClient<Database>()

  const amount = ref<number>(0)
  const pages = ref<number>(0)
  const perPage = ref<number>(10)
  const max = ref<number>(100)

  async function get(filter: SbFilter, eq?: SbEq): Promise<HomebrewItemRow[] | undefined> {
    const { data, count, totalPages } = await sbQuery<HomebrewItemRow>({
      table: 'homebrew_items',
      page: filter.page,
      filters: filter,
      perPage: perPage.value,
      fields: ['name', 'player'],
      fuzzy: true,
      ...(eq && { eq }),
    })

    amount.value = count
    pages.value = totalPages

    return data
  }

  async function getCount(id: number): Promise<number> {
    const { count } = await supabase
      .from('homebrew_items')
      .select('id', { count: 'exact' })
      .eq('campaign', id)

    return count || 0
  }

  async function getHomebrew(match: Omit<HomebrewItemUpdate, NotUpdatable>): Promise<HomebrewItemRow | undefined> {
    const { data, error } = await supabase.from('homebrew_items')
      .select('*')
      .match(match)
      .single()

    if (error) createError(error)
    else return data
  }

  async function addHomebrew(homebrew: HomebrewItemInsert): Promise<void> {
    const { error } = await supabase.from('homebrew_items')
      .insert([homebrew])
      .select('*')

    if (error) throw createError(error)
  }

  async function deleteHomebrew(id: number | number[]): Promise<void> {
    let query = supabase.from('homebrew_items').delete()

    query = Array.isArray(id)
      ? query.in('id', id)
      : query.eq('id', id)

    const { error } = await query

    if (error) throw createError(error)
  }

  async function updateHomebrew(homebrew: Omit<HomebrewItemUpdate, NotUpdatable>, id: number): Promise<void> {
    const { error } = await supabase.from('homebrew_items')
      .update(homebrew as never)
      .eq('id', id)
      .select('*')

    if (error) throw createError(error)
  }

  return {
    max,
    amount,
    pages,
    perPage,
    get,
    getCount,
    getHomebrew,
    addHomebrew,
    updateHomebrew,
    deleteHomebrew,
    sandbox: homebrewExamples as HomebrewItemRow[],
  }
})
