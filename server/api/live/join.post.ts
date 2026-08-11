import { serverSupabaseServiceRole } from '#supabase/server'
import { claimableRowTypes } from '~~/constants/validation'
import { FIVE_MINUTES } from '~~/constants/time'
import * as z from 'zod'

const bodySchema = z
  .object({
    code: z.string().trim().length(6),
    name: z.string().trim().min(1).max(50),
    row: z.string().min(1).optional(),
    spectator: z.boolean().default(false),
  })
  .refine(data => data.spectator || !!data.row, {
    message: 'row is required unless spectator',
    path: ['row'],
  })

export default defineEventHandler(async event => {
  await assertRateLimit(event, {
    key: 'live-join',
    limit: 10,
    windowMs: FIVE_MINUTES,
  })

  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('uuid, code, encounter, expiresAt, endedAt')
    .eq('code', body.code.toUpperCase())
    .maybeSingle()

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  }

  if (session.endedAt || new Date(session.expiresAt) <= new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  }

  if (!body.spectator) {
    const { data: sheet } = await supabase
      .from('initiative_sheets')
      .select('rows')
      .eq('id', session.encounter)
      .single()

    const row = sheet?.rows.find(row => row.id === body.row)
    const claimable = (claimableRowTypes as readonly HomebrewType[]).includes(
      row?.type as HomebrewType,
    )

    if (!row || !claimable) {
      throw createError({ statusCode: 404, statusMessage: 'Row not found' })
    }
  }

  const { data: seat, error } = await supabase.rpc('claim_live_seat', {
    p_session: session.uuid,
    p_row: body.spectator ? null : (body.row ?? null),
    p_name: body.name,
    p_spectator: body.spectator,
  })

  if (error) {
    if (error.code === 'P0001') {
      throw createError(
        postgresErrorToH3Error(error, {
          statusCode: 409,
          statusMessage: 'Live session is full',
        }),
      )
    }

    if (error.code === 'P0002') {
      throw createError(
        postgresErrorToH3Error(error, {
          statusCode: 409,
          statusMessage: 'Row already claimed',
        }),
      )
    }

    throw createError(postgresErrorToH3Error(error))
  }

  await broadcastLiveSeats(supabase, session.uuid, {
    type: 'joined',
    seat: {
      seat: seat.seat,
      row: seat.row,
      name: body.name,
      spectator: body.spectator,
    },
  })

  const expiresAt = new Date(session.expiresAt)

  const [sessionToken, seatToken] = await Promise.all([
    signLiveSessionToken(
      { session: session.uuid, encounter: session.encounter },
      expiresAt,
    ),
    signLiveSeatToken(
      {
        session: session.uuid,
        encounter: session.encounter,
        seat: seat.seat,
        name: body.name,
        spectator: body.spectator,
      },
      expiresAt,
    ),
  ])

  return {
    sessionToken,
    seatToken,
    seat: seat.seat,
    row: seat.row,
    spectator: body.spectator,
    code: session.code,
    expiresAt: session.expiresAt,
    uuid: session.uuid,
  }
})
