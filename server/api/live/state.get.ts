import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const { token } = getQuery(event)

  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Token not provided' })
  }

  const payload = await verifyLiveSessionToken(token)
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('code, expiresAt, endedAt')
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

  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', payload.encounter)
    .single()

  if (!sheet) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  return {
    sheet: toPlayerSheet(sheet),
    session: { code: session.code, expiresAt: session.expiresAt },
  }
})
