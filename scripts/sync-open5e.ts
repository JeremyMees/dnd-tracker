import { createClient } from '@supabase/supabase-js'
import { ONE_MINUTE } from '~~/constants/time'
import type { DB } from '~~/shared/types/database'
import type {
  Open5eDocument,
  Open5eItem,
  Open5eType,
} from '~~/shared/types/open5e'
import { getErrorMessage } from '~~/shared/utils/errors'
import { requestOpen5e } from '~~/shared/utils/open5e-request'
import { transformOpen5eItem } from '~~/shared/utils/transformers/listing'

const PAGE_SIZE = 500
const REQUEST_TIMEOUT = ONE_MINUTE
const SWEEP_FLOOR = 0.9

type SrdTable =
  | 'srd_documents'
  | 'srd_monsters'
  | 'srd_spells'
  | 'srd_magic_items'
  | 'srd_weapons'
  | 'srd_armor'
  | 'srd_conditions'

interface Target {
  type: Open5eType
  table: SrdTable
  chunk: number
}

const targets: Target[] = [
  { type: 'documents', table: 'srd_documents', chunk: 500 },
  { type: 'monsters', table: 'srd_monsters', chunk: 250 },
  { type: 'spells', table: 'srd_spells', chunk: 500 },
  { type: 'magicitems', table: 'srd_magic_items', chunk: 500 },
  { type: 'weapons', table: 'srd_weapons', chunk: 500 },
  { type: 'armor', table: 'srd_armor', chunk: 500 },
  { type: 'conditions', table: 'srd_conditions', chunk: 500 },
]

const dryRun = process.argv.includes('--dry-run')
const only = process.argv
  .find(arg => arg.startsWith('--only='))
  ?.slice('--only='.length)

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) throw new Error(`${name} is not set`)

  return value
}

const supabase = createClient<DB>(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

async function fetchAll<T>(type: Open5eType): Promise<T[]> {
  const items: T[] = []
  let page = 1

  while (true) {
    const response = await requestOpen5e<T>(
      type,
      { page, limit: PAGE_SIZE },
      REQUEST_TIMEOUT,
    )

    items.push(...response.results)

    if (!response.results.length || items.length >= response.count) break

    page++
  }

  return items
}

interface WithDocument {
  key: string
  document: { key: string }
}

function contentRows(
  type: Open5eType,
  items: WithDocument[],
  syncedAt: string,
): { rows: Record<string, unknown>[]; failed: string[] } {
  const rows: Record<string, unknown>[] = []
  const failed: string[] = []

  for (const item of items) {
    try {
      rows.push({
        ...transformOpen5eItem(type, item as unknown as Open5eItem),
        documentKey: item.document.key,
        syncedAt,
      })
    } catch (error) {
      failed.push(`${item.key} (${getErrorMessage(error)})`)
    }
  }

  return { rows, failed }
}

function documentRows(
  items: Open5eDocument[],
  syncedAt: string,
): Record<string, unknown>[] {
  return items.map(document => ({
    id: document.key,
    name: document.name,
    displayName: document.display_name,
    gamesystemKey: document.gamesystem.key,
    publisherKey: document.publisher.key,
    publisherName: document.publisher.name,
    publicationDate: document.publication_date || null,
    syncedAt,
  }))
}

async function countRows(table: SrdTable): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(`${table}: counting failed - ${error.message}`)

  return count ?? 0
}

async function upsertRows(
  table: SrdTable,
  rows: Record<string, unknown>[],
  chunk: number,
): Promise<void> {
  for (let index = 0; index < rows.length; index += chunk) {
    const slice = rows.slice(index, index + chunk)

    const { error } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(slice as any, { onConflict: 'id' })

    if (error) {
      throw new Error(
        `${table}: upserting rows ${index}-${index + slice.length} failed - ${error.message}`,
      )
    }
  }
}

async function sweep(
  table: SrdTable,
  syncedAt: string,
  incoming: number,
  before: number,
): Promise<string> {
  if (before && incoming < before * SWEEP_FLOOR) {
    return `sweep skipped: ${incoming} incoming vs ${before} stored`
  }

  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .lt('syncedAt', syncedAt)

  if (error) throw new Error(`${table}: sweep failed - ${error.message}`)

  return `swept ${count ?? 0}`
}

async function syncTarget(target: Target, syncedAt: string): Promise<boolean> {
  const { type, table, chunk } = target
  const label = table.padEnd(16)

  let items: WithDocument[]

  try {
    items = await fetchAll<WithDocument>(type)
  } catch (error) {
    console.error(
      `${label} fetch failed, left untouched - ${getErrorMessage(error)}`,
    )

    return false
  }

  const { rows, failed } =
    type === 'documents'
      ? {
          rows: documentRows(items as unknown as Open5eDocument[], syncedAt),
          failed: [] as string[],
        }
      : contentRows(type, items, syncedAt)

  if (dryRun) {
    console.info(
      `${label} ${items.length} fetched, ${rows.length} rows, ${failed.length} unmappable (dry run)`,
    )
    if (failed.length) console.warn(`${label} unmappable: ${failed.join(', ')}`)

    return !failed.length
  }

  const before = await countRows(table)

  await upsertRows(table, rows, chunk)

  const swept = failed.length
    ? 'sweep skipped: some rows could not be mapped'
    : await sweep(table, syncedAt, rows.length, before)

  console.info(`${label} ${before} -> ${rows.length} upserted, ${swept}`)

  if (failed.length) console.warn(`${label} unmappable: ${failed.join(', ')}`)

  return !failed.length
}

async function main(): Promise<void> {
  const syncedAt = new Date().toISOString()
  const selected = only ? targets.filter(t => t.type === only) : targets

  if (!selected.length) throw new Error(`--only=${only} matches no target`)

  console.info(
    `syncing ${selected.length} target(s) at ${syncedAt}${dryRun ? ' (dry run)' : ''}`,
  )

  const results = await Promise.all(
    selected.map(target => syncTarget(target, syncedAt)),
  )

  const failed = results.filter(ok => !ok).length

  if (failed) {
    throw new Error(`${failed} of ${selected.length} target(s) had problems`)
  }

  console.info('done')
}

main().catch((error: unknown) => {
  console.error(getErrorMessage(error))
  process.exitCode = 1
})
