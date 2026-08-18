import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockStorage } from '~~/test/unit/stubs/storage'
import { assertRateLimit } from '~~/server/utils/rate-limit'

describe('assertRateLimit', () => {
  beforeEach(() => {
    mockStorage()
  })

  it('allows requests under the limit', async () => {
    const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

    await expect(
      assertRateLimit(event, { key: 'test', limit: 2, windowMs: 60_000 }),
    ).resolves.toBeUndefined()
    await expect(
      assertRateLimit(event, { key: 'test', limit: 2, windowMs: 60_000 }),
    ).resolves.toBeUndefined()
  })

  it('throws a 429 once the limit is exceeded', async () => {
    const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

    await assertRateLimit(event, { key: 'test', limit: 1, windowMs: 60_000 })

    await expect(
      assertRateLimit(event, { key: 'test', limit: 1, windowMs: 60_000 }),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })

  it('tracks separate IPs independently', async () => {
    const eventA = mockEvent({ headers: { 'x-forwarded-for': '1.1.1.1' } })
    const eventB = mockEvent({ headers: { 'x-forwarded-for': '2.2.2.2' } })

    await assertRateLimit(eventA, { key: 'test', limit: 1, windowMs: 60_000 })

    await expect(
      assertRateLimit(eventB, { key: 'test', limit: 1, windowMs: 60_000 }),
    ).resolves.toBeUndefined()
  })

  it('tracks separate keys independently for the same IP', async () => {
    const event = mockEvent({ headers: { 'x-forwarded-for': '1.2.3.4' } })

    await assertRateLimit(event, { key: 'a', limit: 1, windowMs: 60_000 })

    await expect(
      assertRateLimit(event, { key: 'b', limit: 1, windowMs: 60_000 }),
    ).resolves.toBeUndefined()
  })
})
