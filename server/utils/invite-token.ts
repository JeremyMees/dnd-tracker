export interface InviteTokenPayload {
  campaign: number
  user: string
  role: UserRole
}

export async function verifyInviteToken(
  token: string,
): Promise<InviteTokenPayload> {
  const { data } = await verifyJWT(useRuntimeConfig().jwtSecret, token).catch(
    (error: Error) => {
      throw error.message === 'Expired JWT'
        ? createError({ statusCode: 410, statusMessage: 'Invite expired' })
        : createError({ statusCode: 400, statusMessage: 'Invalid invite' })
    },
  )

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
    throw createError({ statusCode: 400, statusMessage: 'Invalid invite' })

  return data as InviteTokenPayload
}
