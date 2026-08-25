import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
  seat: z.string().min(1),
  row: z.string().min(1),
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

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('rows')
    .eq('id', encounter.id)
    .single()

  const rowExists = sheet?.rows.some(row => row.id === body.row)

  if (!rowExists) {
    throw createError({ statusCode: 404, statusMessage: 'row-not-found' })
  }

  const { data: seat, error } = await supabase.rpc('reassign_live_seat', {
    p_session: session.uuid,
    p_seat: body.seat,
    p_row: body.row,
  })

  if (error) {
    if (error.code === 'P0001') {
      throw createError(
        postgresErrorToH3Error(error, {
          statusCode: 409,
          statusMessage: 'row-claimed',
        }),
      )
    }

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
    type: 'reassigned',
    seat: body.seat,
    row: seat.row,
  })

  return { seat }
})
