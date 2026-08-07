export async function sbQuery<T>(options: SbFetchOptions): Promise<SbQuery<T>> {
  const supabase = useSupabaseClient<DB>()

  const { table, select, page, perPage, filters, fuzzy, fields } = options
  const { eq, search, sortBy, sortDesc } = filters || {}

  let query = supabase.from(table).select(select || '*', { count: 'estimated' })

  if (typeof page === 'number' && typeof perPage === 'number') {
    const { from, to } = sbRange(page, perPage)

    query = query.range(from, to)
  }

  if (sortBy) {
    query = query.order(sortBy, {
      ascending: sortDesc !== undefined ? !sortDesc : true,
      nullsFirst: false,
    })
  }

  if (eq) {
    query = query.eq(eq.field, eq.value)
  }

  if (search && fuzzy) {
    query = query.or(sbOrQuery(fields || ['title'], search))
  }

  const { data, error, count } = await query

  if (error) throw createError(error)

  return {
    data: data as T[],
    totalPages: perPage ? sbPages(count, perPage) : 1,
    count: count || 0,
  }
}

export function sbOrQuery(keys: string[], search: string): string {
  let queryString = ''

  keys.forEach((key: string, i: number) => {
    const escapedSearch = search.replace(/([%_])/g, '\\$1')
    queryString += `${i ? ',' : ''}${key}.ilike.*${escapedSearch}*`
  })

  return queryString
}

export function sbRange(page: number, perPage: number): SbRange {
  const from = page ? page * perPage : 0
  const to = page ? from + perPage - 1 : perPage - 1

  return { from, to }
}

export function sbPages(count: number | null, perPage: number): number {
  return Math.ceil((count || 1) / perPage)
}

export function sbCount(key: string, obj: object): number {
  const value = (obj as Record<string, unknown>)[key]

  if (Array.isArray(value) && value.length) {
    const [first] = value

    if (typeof first === 'object' && first !== null && 'count' in first) {
      return typeof first.count === 'number' ? first.count : 0
    }
  }

  return 0
}
