export interface InviteTokenPayload {
  campaign: number
  user: string
  role: UserRole
}

export async function verifyInviteToken(
  token: string,
): Promise<InviteTokenPayload> {
  const claims = await verifyJWT(useRuntimeConfig().jwtSecret, token)
  const { data } = claims

  if (
    data === null ||
    typeof data !== 'object' ||
    !('campaign' in data) ||
    typeof data.campaign !== 'number' ||
    !('user' in data) ||
    typeof data.user !== 'string' ||
    !('role' in data) ||
    typeof data.role !== 'string'
  )
    throw createError('Invalid JWT')

  return data as InviteTokenPayload
}
