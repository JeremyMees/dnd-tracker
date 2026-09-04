import { serverSupabaseServiceRole } from '#supabase/server'
import { claimableRowTypes } from '~~/constants/validation'

export default defineEventHandler(async (event): Promise<LiveCodeSession> => {
  const { code } = getQuery(event)

  if (!code || typeof code !== 'string' || code.length !== 6) {
    throw createError({ statusCode: 400, statusMessage: 'Code not provided' })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('code, encounter, expiresAt, endedAt, seats')
    .eq('code', code.toUpperCase())
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

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', session.encounter)
    .single()

  if (!sheet) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  const claimedRows = new Set(
    session.seats.filter(seat => seat.row).map(seat => seat.row),
  )

  const rows = toPlayerSheet(sheet)
    .rows.filter(
      row =>
        (claimableRowTypes as readonly HomebrewType[]).includes(row.type) &&
        !claimedRows.has(row.id),
    )
    .map(row => ({ id: row.id, name: row.name, type: row.type }))

  return { code: session.code, expiresAt: session.expiresAt, rows }
})
