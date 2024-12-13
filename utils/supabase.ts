export async function sbQuery<T>(options: SbFetchOptions): Promise<SbQuery<T>> {
  const supabase = useSupabaseClient<Database>()

  const { table, select, page, perPage, filters, eq, fuzzy, fields } = options

  let query = supabase
    .from(table)
    .select(select || '*', { count: 'estimated' })

  if (typeof page === 'number' && typeof perPage === 'number') {
    const { from, to } = sbRange(page, perPage)

    query = query.range(from, to)
  }

  if (filters?.sortBy) {
    query = query.order(filters.sortBy, {
      ascending: filters.sortACS || false,
      nullsFirst: false,
    })
  }

  if (eq) {
    query = query.eq(eq.field, eq.value)
  }

  if (filters?.search && fuzzy) {
    query = query.or(sbOrQuery(fields || ['title'], filters.search))
  }

  const { data, error, count } = await query

  if (error) createError(error)

  return {
    data: data as T[],
    totalPages: perPage ? sbPages(count, perPage) : 1,
    count: count || 0,
  }
}

function sbOrQuery(keys: string[], search: string): string {
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

export function sbCount(key: string, obj: Record<string, any>): number {
  const value = obj[key]

  if (value && Array.isArray(value) && value.length) return value[0].count
  else return 0
}
