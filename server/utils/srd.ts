import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { gameSystems } from '~~/constants/dnd'

type SrdContentType = Exclude<Open5eType, 'documents'>

const contentTables = {
  spells: 'srd_spells',
  conditions: 'srd_conditions',
  magicitems: 'srd_magic_items',
  weapons: 'srd_weapons',
  armor: 'srd_armor',
} as const

const monsterOrderColumns = [
  'hitPoints',
  'armorClass',
  'challengeRating',
] as const

type MonsterOrderColumn = (typeof monsterOrderColumns)[number]

export interface SrdListingQuery {
  type: SrdContentType
  page: number
  search: string
  documents: string[]
  ordering: Open5eSortBy
  cr?: number
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, match => `\\${match}`)
}

function isMonsterOrderColumn(value: string): value is MonsterOrderColumn {
  return (monsterOrderColumns as readonly string[]).includes(value)
}

export function monsterOrder(ordering: Open5eSortBy): {
  column: 'name' | MonsterOrderColumn
  ascending: boolean
} {
  const descending = ordering.startsWith('-')
  const key = descending ? ordering.slice(1) : ordering

  if (!isMonsterOrderColumn(key)) return { column: 'name', ascending: true }

  return { column: key, ascending: !descending }
}

function srdError(message: string, cause: unknown): never {
  throw createError({ statusCode: 500, statusMessage: message, cause })
}

type WithoutMeta<T> = T extends unknown
  ? Omit<T, 'documentKey' | 'syncedAt'>
  : never

function stripMeta<T extends { documentKey: string; syncedAt: string }>(
  row: T,
): WithoutMeta<T> {
  const { documentKey, syncedAt, ...item } = row

  return item as WithoutMeta<T>
}

function pageCount(count: number | null, pageSize: number): number {
  return Math.ceil((count ?? 0) / pageSize)
}

export async function srdListing(
  event: H3Event,
  query: SrdListingQuery,
  pageSize: number,
): Promise<Open5eListingResult> {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const from = query.page * pageSize
  const to = from + pageSize - 1
  const pattern = `%${escapeLike(query.search)}%`

  if (query.type === 'monsters') {
    const { column, ascending } = monsterOrder(query.ordering)

    let builder = supabase
      .from('srd_monsters')
      .select('*', { count: 'exact' })
      .in('documentKey', query.documents)
      .ilike('name', pattern)

    if (query.cr !== undefined) {
      builder = builder.eq('challengeRating', query.cr)
    }

    const { data, count, error } = await builder
      .order(column, { ascending })
      .order('id', { ascending: true })
      .range(from, to)

    if (error) srdError('Could not read the stored monsters', error)

    return narrowListing(
      'monsters',
      data.map(stripMeta),
      pageCount(count, pageSize),
    )
  }

  const { data, count, error } = await supabase
    .from(contentTables[query.type])
    .select('*', { count: 'exact' })
    .in('documentKey', query.documents)
    .ilike('name', pattern)
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) srdError(`Could not read the stored ${query.type}`, error)

  return narrowListing(
    query.type,
    data.map(stripMeta),
    pageCount(count, pageSize),
  )
}

export async function srdDocuments(event: H3Event): Promise<DndDocument[]> {
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data, error } = await supabase
    .from('srd_documents')
    .select('*')
    .in('gamesystemKey', gameSystems)
    .order('publicationDate', { ascending: false, nullsFirst: false })

  if (error) srdError('Could not read the stored documents', error)

  return data.map(({ syncedAt, ...document }) => document)
}

export async function srdConditions(
  event: H3Event,
  documentKey: string,
): Promise<DndCondition[]> {
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data, error } = await supabase
    .from('srd_conditions')
    .select('*')
    .eq('documentKey', documentKey)
    .order('name', { ascending: true })

  if (error) srdError('Could not read the stored conditions', error)

  return data.map(stripMeta)
}
