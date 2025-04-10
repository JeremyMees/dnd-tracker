import { TimeSpan } from 'oslo'
import { createJWT } from 'oslo/jwt'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user = await serverSupabaseUser(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!user) throw createError('User not found')
  if (!body.campaign || !body.user || !body.role) throw createError('Correct data not provided')

  const jwt = await createJWT('HS256', new TextEncoder().encode(secret), {
    user: user.id,
    data: body,
  }, {
    expiresIn: new TimeSpan(1, 'w'),
    includeIssuedTimestamp: true,
  })

  return jwt
})
