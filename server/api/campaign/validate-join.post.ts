export default defineEventHandler(async event => {
  const { token } = await readBody(event)

  if (!token || typeof token !== 'string')
    throw createError('Token not provided')

  return await verifyInviteToken(token)
})
