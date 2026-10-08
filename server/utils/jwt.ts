import { SignJWT, jwtVerify } from 'jose'

function hmacKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signJWT(
  secret: string,
  claims: object,
  expiresAt: Date,
): Promise<string> {
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(hmacKey(secret))
}

export async function verifyJWT(
  secret: string,
  token: string,
): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, hmacKey(secret), {
    algorithms: ['HS256'],
  })

  return payload
}
