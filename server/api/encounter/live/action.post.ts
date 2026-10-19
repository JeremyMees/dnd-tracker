import { serverSupabaseServiceRole } from '#supabase/server'
import { ONE_MINUTE } from '~~/constants/time'
import { diffRow } from '~~/shared/utils/dnd/combat-events'
import { z } from 'zod'

const bodySchema = z.object({
  seatToken: z.string().min(1),
  action: liveActionSchema,
})

export default defineEventHandler(async event => {
  await assertRateLimit(event, {
    key: 'live-action',
    limit: 60,
    windowMs: ONE_MINUTE,
  })

  const body = await readValidatedBody(event, bodySchema.parse)
  const payload = await verifyLiveSeatToken(body.seatToken)

  if (payload.spectator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Spectators cannot act',
    })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('seats, expiresAt, endedAt')
    .eq('uuid', payload.session)
    .eq('encounter', payload.encounter)
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

  const seat = session.seats.find(s => s.seat === payload.seat)

  if (!seat || !seat.row) {
    throw createError({ statusCode: 403, statusMessage: 'No row claimed' })
  }

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('activeIndex, round, rows, settings')
    .eq('id', payload.encounter)
    .single()

  if (!sheet) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  const ownRow = sheet.rows.find(row => row.id === seat.row)

  if (!ownRow) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const isOwnTurn = sheet.rows[sheet.activeIndex]?.id === seat.row

  if (!isOwnTurn && body.action.type !== 'reaction') {
    throw createError({ statusCode: 403, statusMessage: 'Not your turn' })
  }

  if (sheet.settings?.live?.allow?.[body.action.type] === false) {
    throw createError({ statusCode: 403, statusMessage: 'Action not allowed' })
  }

  if (body.action.type === 'endTurn') {
    await advanceEncounterTurn(supabase, payload.encounter, sheet, {
      actorName: seat.name,
      session: payload.session,
      broadcastReminders: true,
    })

    return { synced: true }
  }

  let patch

  if (body.action.type === 'hp') {
    patch = await buildHpPatch(
      supabase,
      payload.encounter,
      seat.row,
      body.action,
    )
  } else if (body.action.type === 'ac') {
    patch = await buildAcPatch(
      supabase,
      payload.encounter,
      seat.row,
      body.action,
    )
  } else if (body.action.type === 'reaction') {
    patch = {
      resources: {
        ...ownRow.resources,
        reaction: body.action.value || undefined,
      },
    }
  } else {
    patch = { [body.action.type]: body.action.value }
  }

  const { data: row, error } = await supabase.rpc('apply_live_action', {
    p_encounter: payload.encounter,
    p_row_id: seat.row,
    p_patch: patch,
  })

  if (error) throw createError(postgresErrorToH3Error(error))

  await logCombatEvents(supabase, {
    encounterId: payload.encounter,
    rowId: seat.row,
    round: sheet.round,
    actorName: seat.name,
    events: diffRow(ownRow, row),
  })

  await broadcastLiveAction(supabase, payload.session, {
    row: seat.row,
    patch: sanitizeBroadcastPatch(row, body.action.type, patch),
  })

  await broadcastSheetAction(supabase, payload.encounter, {
    row: seat.row,
    patch,
  })

  return { row }
})
