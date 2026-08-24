function liveTokenSecret(): string {
  return useRuntimeConfig().jwtSecret
}

function invalidLiveToken(cause?: unknown) {
  return createError({
    statusCode: 401,
    statusMessage: 'Invalid live session token',
    cause,
  })
}

async function signLivePayload(
  payload: LiveSessionTokenPayload | LiveSeatTokenPayload | LiveRowTokenPayload,
  expiresAt: Date,
): Promise<string> {
  return await signJWT(liveTokenSecret(), payload, expiresAt)
}

async function verifyLivePayload(
  token: string,
): Promise<Record<string, unknown>> {
  try {
    return await verifyJWT(liveTokenSecret(), token)
  } catch (cause) {
    throw invalidLiveToken(cause)
  }
}

export async function signLiveSessionToken(
  payload: Omit<LiveSessionTokenPayload, 'kind'>,
  expiresAt: Date,
): Promise<string> {
  return await signLivePayload({ ...payload, kind: 'session' }, expiresAt)
}

export async function verifyLiveSessionToken(
  token: string,
): Promise<LiveSessionTokenPayload> {
  const payload = await verifyLivePayload(token)

  if (
    payload.kind !== 'session' ||
    !('session' in payload) ||
    !('encounter' in payload)
  ) {
    throw invalidLiveToken()
  }

  return payload as unknown as LiveSessionTokenPayload
}

export async function signLiveSeatToken(
  payload: Omit<LiveSeatTokenPayload, 'kind'>,
  expiresAt: Date,
): Promise<string> {
  return await signLivePayload({ ...payload, kind: 'seat' }, expiresAt)
}

export async function verifyLiveSeatToken(
  token: string,
): Promise<LiveSeatTokenPayload> {
  const payload = await verifyLivePayload(token)

  if (
    payload.kind !== 'seat' ||
    !('session' in payload) ||
    !('encounter' in payload) ||
    !('seat' in payload) ||
    !('name' in payload) ||
    !('spectator' in payload)
  ) {
    throw invalidLiveToken()
  }

  return payload as unknown as LiveSeatTokenPayload
}

export async function signLiveRowToken(
  payload: Omit<LiveRowTokenPayload, 'kind'>,
  expiresAt: Date,
): Promise<string> {
  return await signLivePayload({ ...payload, kind: 'row' }, expiresAt)
}

export async function verifyLiveRowToken(
  token: string,
): Promise<LiveRowTokenPayload> {
  const payload = await verifyLivePayload(token)

  if (
    payload.kind !== 'row' ||
    !('session' in payload) ||
    !('encounter' in payload) ||
    !('row' in payload)
  ) {
    throw invalidLiveToken()
  }

  return payload as unknown as LiveRowTokenPayload
}
