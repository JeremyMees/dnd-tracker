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

  const { data: session, error } = await supabase
    .from('live_sessions')
    .update({ endedAt: new Date().toISOString() })
    .eq('encounter', encounter.id)
    .is('endedAt', null)
    .select('id')
    .maybeSingle()

  if (error) throw createError(postgresErrorToH3Error(error))

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'no-active-session',
    })
  }

  return { success: true }
})
