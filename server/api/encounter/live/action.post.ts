import { serverSupabaseServiceRole } from '#supabase/server'
import { ONE_MINUTE } from '~~/constants/time'
import { z } from 'zod'

const bodySchema = z.object({
  seatToken: z.string().min(1),
  action: liveActionSchema,
})

export default defineEventHandler(async event => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const payload = await verifyLiveSeatToken(body.seatToken)

  await assertRateLimit(event, {
    key: `live-action:${payload.seat}`,
    limit: 60,
    windowMs: ONE_MINUTE,
  })

  if (payload.spectator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Spectators cannot act',
    })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)

  const encounter = sheetChangeContext(supabase, payload.encounter, {})

  const [{ data: session }, sheet] = await Promise.all([
    supabase
      .from('live_sessions')
      .select('seats, expiresAt, endedAt')
      .eq('uuid', payload.session)
      .eq('encounter', payload.encounter)
      .maybeSingle(),
    readSheet(encounter),
  ])

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

  if (!seat?.row) {
    throw createError({ statusCode: 403, statusMessage: 'No row claimed' })
  }

  const changes = { ...encounter, actor: { name: seat.name } }
  const ownRow = sheet.rows.find(row => row.id === seat.row)

  if (!ownRow) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const isOwnTurn = sheet.rows[sheet.activeIndex]?.id === seat.row

  const anyTurn =
    body.action.type === 'reaction' ||
    (body.action.type === 'ready' && !body.action.value)

  if (!isOwnTurn && !anyTurn) {
    throw createError({ statusCode: 403, statusMessage: 'Not your turn' })
  }

  if (sheet.settings?.live?.allow?.[body.action.type] === false) {
    throw createError({ statusCode: 403, statusMessage: 'Action not allowed' })
  }

  if (body.action.type === 'endTurn') {
    await advanceSheetTurn(changes, {
      before: sheet,
      session: payload.session,
      sendReminders: true,
    })

    return { synced: true }
  }

  const patch = await buildLiveActionPatch(
    supabase,
    ownRow,
    sheet.settings,
    body.action,
  )

  const [row] = await applyRowPatches(changes, [{ rowId: seat.row, patch }], {
    before: sheet,
    seat: { session: payload.session },
  })

  return { row }
})
