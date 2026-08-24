import {
  createJWTSignatureMessage,
  encodeJWT,
  joseAlgorithmHS256,
  parseJWT,
  JWSRegisteredHeaders,
  JWTRegisteredClaims,
} from '@oslojs/jwt'

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signJWT(
  secret: string,
  claims: object,
  expiresAt: Date,
): Promise<string> {
  const headerJSON = JSON.stringify({ alg: joseAlgorithmHS256, typ: 'JWT' })
  const payloadJSON = JSON.stringify({
    ...claims,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  })

  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    Uint8Array.from(createJWTSignatureMessage(headerJSON, payloadJSON)),
  )

  return encodeJWT(headerJSON, payloadJSON, new Uint8Array(signature))
}

export async function verifyJWT(
  secret: string,
  token: string,
): Promise<Record<string, unknown>> {
  const [header, payload, signature, signatureMessage] = parseJWT(token)

  const headers = new JWSRegisteredHeaders(header)

  if (!headers.hasAlgorithm() || headers.algorithm() !== joseAlgorithmHS256) {
    throw new Error('Invalid algorithm')
  }

  const validSignature = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    Uint8Array.from(signature),
    Uint8Array.from(signatureMessage),
  )

  if (!validSignature) throw new Error('Invalid signature')

  const claims = new JWTRegisteredClaims(payload)

  if (claims.hasExpiration() && !claims.verifyExpiration()) {
    throw new Error('Expired JWT')
  }

  if (claims.hasNotBefore() && !claims.verifyNotBefore()) {
    throw new Error('Inactive JWT')
  }

  return payload as Record<string, unknown>
}
