import { createJWT, validateJWT } from 'oslo/jwt'
import { TimeSpan } from 'oslo'

function liveTokenSecret() {
  return new TextEncoder().encode(useRuntimeConfig().jwtSecret)
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
  return await createJWT('HS256', liveTokenSecret(), payload, {
    expiresIn: new TimeSpan(
      Math.max(expiresAt.getTime() - Date.now(), 0),
      'ms',
    ),
    includeIssuedTimestamp: true,
  })
}

async function verifyLivePayload(
  token: string,
): Promise<Record<string, unknown>> {
  try {
    const jwt = await validateJWT('HS256', liveTokenSecret(), token)

    return jwt.payload as Record<string, unknown>
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
