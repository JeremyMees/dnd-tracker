import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
  seat: z.string().min(1),
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
    .maybeSingle()

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'no-active-session',
    })
  }

  const { error } = await supabase.rpc('remove_live_seat', {
    p_session: session.uuid,
    p_seat: body.seat,
  })

  if (error) {
    if (error.code === 'P0002') {
      throw createError(
        postgresErrorToH3Error(error, {
          statusCode: 404,
          statusMessage: 'seat-not-found',
        }),
      )
    }

    throw createError(postgresErrorToH3Error(error))
  }

  await broadcastLiveSeats(supabase, session.uuid, {
    type: 'kicked',
    seat: body.seat,
  })

  return { success: true }
})
