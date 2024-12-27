export const useNotes = defineStore('useNotes', () => {
  const supabase = useSupabaseClient<Database>()

  const max = 100
  const amount = ref<number>(0)
  const pages = ref<number>(0)
  const perPage = ref<number>(10)

  async function get(filter: SbFilter, eq?: SbEq): Promise<NoteRow [] | undefined> {
    const { data, count, totalPages } = await sbQuery<NoteRow>({
      table: 'notes',
      page: filter.page,
      filters: filter,
      perPage: perPage.value,
      fuzzy: true,
      ...(eq && { eq }),
    })

    amount.value = count
    pages.value = totalPages

    return data
  }

  async function getCount(id: number): Promise<number> {
    const { count } = await supabase
      .from('notes')
      .select('id', { count: 'exact' })
      .eq('campaign', id)

    return count || 0
  }

  async function getNote(match: NoteUpdate): Promise<NoteRow | undefined> {
    const { data, error } = await supabase.from('notes')
      .select('*')
      .match(match)
      .single()

    if (error) createError(error)
    else return data
  }

  async function addNote(note: NoteInsert): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .insert([note])

    if (error) throw createError(error)
  }

  async function deleteNote(id: number | number[]): Promise<void> {
    let query = supabase.from('notes').delete()

    query = Array.isArray(id)
      ? query.in('id', id)
      : query.eq('id', id)

    const { error } = await query

    if (error) throw createError(error)
  }

  async function updateNote(note: Omit<NoteUpdate, NotUpdatable>, id: number): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update(note)
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
    getNote,
    addNote,
    deleteNote,
    updateNote,
  }
})
