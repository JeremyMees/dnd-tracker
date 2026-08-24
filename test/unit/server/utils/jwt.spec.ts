import { describe, expect, it } from 'vitest'
import { signJWT, verifyJWT } from '~~/server/utils/jwt'

const secret = 'test-secret'
const future = new Date(Date.now() + 60_000)

async function craftToken(header: object, payload: object) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  const message = `${encode(header)}.${encode(payload)}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, Buffer.from(message))

  return `${message}.${Buffer.from(signature).toString('base64url')}`
}

describe('jwt', () => {
  it('round-trips claims alongside iat and exp', async () => {
    const token = await signJWT(secret, { user: 'user-1' }, future)

    await expect(verifyJWT(secret, token)).resolves.toMatchObject({
      user: 'user-1',
      exp: Math.floor(future.getTime() / 1000),
    })
  })

  it('rejects a token whose header declares another algorithm', async () => {
    const token = await craftToken(
      { alg: 'HS512', typ: 'JWT' },
      { user: 'user-1' },
    )

    await expect(verifyJWT(secret, token)).rejects.toThrow('Invalid algorithm')
  })

  it('rejects a token whose header has no algorithm', async () => {
    const token = await craftToken({ typ: 'JWT' }, { user: 'user-1' })

    await expect(verifyJWT(secret, token)).rejects.toThrow('Invalid algorithm')
  })

  it('rejects a token that is not valid yet', async () => {
    const token = await craftToken(
      { alg: 'HS256', typ: 'JWT' },
      { user: 'user-1', nbf: Math.floor(Date.now() / 1000) + 60 },
    )

    await expect(verifyJWT(secret, token)).rejects.toThrow('Inactive JWT')
  })
})
