import { serverSupabaseServiceRole } from '#supabase/server'
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
    .select('uuid, expiresAt')
    .eq('encounter', encounter.id)
    .is('endedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  if (!session) return { synced: false }

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', encounter.id)
    .single()

  if (!sheet) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  await broadcastLiveState(supabase, session.uuid, toPlayerSheet(sheet))

  return { synced: true }
})
