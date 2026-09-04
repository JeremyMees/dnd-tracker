import { serverSupabaseServiceRole } from '#supabase/server'
import { aggregateCombatStats } from '~~/shared/utils/dnd/combat-stats'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<DB>(event)

  const encounter = await requireEncounterAccess(event, body.encounter, user.id)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('uuid')
    .eq('encounter', encounter.id)
    .is('endedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  if (!session) return { shared: false }

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', encounter.id)
    .single()

  if (!sheet) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  const { data: events, error } = await supabase
    .from('combat_events')
    .select('rowId, round, type, payload')
    .eq('encounterId', encounter.id)

  if (error) throw createError(postgresErrorToH3Error(error))

  const masked = toPlayerSheet(sheet).rows
  const known = new Set(masked.map(row => row.id))

  const stats = aggregateCombatStats(
    events.filter(combatEvent => known.has(combatEvent.rowId)),
    masked.map(row => ({ id: row.id, name: row.name, type: row.type })),
    sheet.round,
  )

  await broadcastLiveSummary(supabase, session.uuid, stats)

  return { shared: true }
})
