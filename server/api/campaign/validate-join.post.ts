import { validateJWT } from 'oslo/jwt'
import type { UserRole } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const { token } = await readBody(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!token || typeof token !== 'string') throw createError('Token not provided')

  const jwt = await validateJWT('HS256', new TextEncoder().encode(secret), token)

  if (
    !jwt.payload
    || typeof jwt.payload !== 'object'
    || !('data' in jwt.payload)
    || jwt.payload.data === null
    || typeof jwt.payload.data !== 'object'
    || !('campaign' in jwt.payload.data)
    || typeof jwt.payload.data.campaign !== 'number'
    || !('role' in jwt.payload.data)
    || typeof jwt.payload.data.role !== 'string'
    || !('user' in jwt.payload.data)
    || typeof jwt.payload.data.user !== 'string'
  ) throw createError('Invalid JWT')

  const { data } = jwt.payload as { data: { campaign: number, user: string, role: UserRole } }

  return data
})
