export default defineEventHandler(async event => {
  const { token } = await readBody(event)
  const secret = useRuntimeConfig().jwtSecret

  if (!token || typeof token !== 'string')
    throw createError('Token not provided')

  const claims = await verifyJWT(secret, token)

  if (
    !('data' in claims) ||
    claims.data === null ||
    typeof claims.data !== 'object' ||
    !('campaign' in claims.data) ||
    typeof claims.data.campaign !== 'number' ||
    !('role' in claims.data) ||
    typeof claims.data.role !== 'string' ||
    !('user' in claims.data) ||
    typeof claims.data.user !== 'string'
  )
    throw createError('Invalid JWT')

  const { data } = claims as {
    data: { campaign: number; user: string; role: UserRole }
  }

  return data
})
