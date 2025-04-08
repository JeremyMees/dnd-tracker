import { TimeSpan } from 'oslo'
import { createJWT } from 'oslo/jwt'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user = await serverSupabaseUser(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!user) throw createError('User not found')
  if (!body.encounter) throw createError('Encounter not provided')

  const jwt = await createJWT('HS256', new TextEncoder().encode(secret), {
    user: user.id,
    encounter: body.encounter,
  }, {
    expiresIn: new TimeSpan(1, 'w'),
    includeIssuedTimestamp: true,
  })

  return jwt
})
