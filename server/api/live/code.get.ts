import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const { code } = getQuery(event)

  if (!code || typeof code !== 'string' || code.length !== 6) {
    throw createError({ statusCode: 400, statusMessage: 'Code not provided' })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: session } = await supabase
    .from('live_sessions')
    .select('code, expiresAt, endedAt')
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

  return { code: session.code, expiresAt: session.expiresAt }
})
