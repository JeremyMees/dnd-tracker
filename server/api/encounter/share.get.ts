import { validateJWT } from 'oslo/jwt'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const { token } = getQuery(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!token || typeof token !== 'string') throw createError('Token not provided')

  const jwt = await validateJWT('HS256', new TextEncoder().encode(secret), token)

  if (!jwt || !('encounter' in jwt.payload) || !('user' in jwt.payload)) throw createError('Invalid JWT')

  const { encounter, user } = jwt.payload as { encounter: number, user: string }

  const { data, error } = await supabase
    .from('initiative_sheets')
    .select(`
      *, 
      campaign(
        id,
        title,
        created_by(id, username, avatar), 
        team(
          id,
          role, 
          user(id, username, avatar)
        )
      )
    `)
    .match({ id: encounter })
    .single()

  if (error) throw createError(error)

  const isOwner = data.created_by === user
  const isTeamMember = data.campaign?.team.some(member => member.user.id === user)

  if (!isOwner && !isTeamMember) throw createError('Unauthorized')

  return data
})
