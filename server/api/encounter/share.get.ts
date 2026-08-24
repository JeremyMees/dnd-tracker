import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const { token } = getQuery(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Token not provided' })
  }

  let payload: { encounter: number; user: string }

  try {
    const claims = await verifyJWT(secret, token)

    if (!('encounter' in claims) || !('user' in claims))
      throw new Error('Missing encounter or user claim')

    payload = claims as { encounter: number; user: string }
  } catch (cause) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid JWT', cause })
  }

  const { encounter, user } = payload

  const { data, error } = await supabase
    .from('initiative_sheets')
    .select(
      `
      *, 
      campaign(
        id,
        title,
        createdBy(id, username, avatar), 
        team(
          id,
          role, 
          user(id, username, avatar)
        )
      )
    `,
    )
    .match({ id: encounter })
    .single()

  if (error) throw createError(postgresErrorToH3Error(error))

  const isOwner = data.createdBy === user
  const isTeamMember = data.campaign?.team.some(
    member => member.user.id === user,
  )

  if (!isOwner && !isTeamMember) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return data
})
