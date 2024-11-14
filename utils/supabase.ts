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

export function sbGetTeamMembers(data: CampaignItem): TeamMember[] {
  return [
    {
      user: data.created_by,
      role: 'Owner',
      id: 1,
    },
    ...data.team,
  ]
}
