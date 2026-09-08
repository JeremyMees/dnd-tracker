import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import { mockStorage } from '~~/test/unit/stubs/storage'
import handler from '~~/server/api/names.get'

const RATE_LIMIT = 60

function namesEvent(query: Record<string, string> = {}) {
  return mockEvent({
    path: `/api/names?${new URLSearchParams(query)}`,
    headers: { 'x-forwarded-for': '1.2.3.4' },
  })
}

describe('GET /api/names', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockStorage()
  })

  it('returns a single name by default', async () => {
    await expect(handler(namesEvent())).resolves.toHaveLength(1)
  })

  it('returns the requested amount of names', async () => {
    await expect(handler(namesEvent({ amount: '30' }))).resolves.toHaveLength(
      30,
    )
  })

  it('returns plain generated names', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const names = await handler(namesEvent({ amount: '3', race: 'elf' }))

    names.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/))
  })

  it('narrows generation to the given race and gender', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const names = await handler(
      namesEvent({ amount: '3', race: 'dwarf', gender: 'male' }),
    )
    const elves = await handler(
      namesEvent({ amount: '3', race: 'elf', gender: 'male' }),
    )

    expect(new Set(names).size).toBe(1)
    expect(names[0]).not.toBe(elves[0])
  })

  it('never lets a response be cached', async () => {
    const event = namesEvent()

    await handler(event)

    expect(responseHeader(event, 'Cache-Control')).toBe('no-store')
  })

  it('rejects an unknown race', async () => {
    await expect(handler(namesEvent({ race: 'orc' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('rejects an unknown gender', async () => {
    await expect(
      handler(namesEvent({ gender: 'other' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects the random sentinel, which the client strips instead', async () => {
    await expect(handler(namesEvent({ race: 'random' }))).rejects.toMatchObject(
      { statusCode: 400 },
    )
  })

  it('rejects an amount below one', async () => {
    await expect(handler(namesEvent({ amount: '0' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('rejects an amount large enough to be an attack', async () => {
    await expect(handler(namesEvent({ amount: '51' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('rejects a fractional amount', async () => {
    await expect(handler(namesEvent({ amount: '1.5' }))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws a 429 after too many requests from the same IP', async () => {
    for (let i = 0; i < RATE_LIMIT; i++) {
      await expect(handler(namesEvent())).resolves.toHaveLength(1)
    }

    await expect(handler(namesEvent())).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })

  it('counts rejected requests towards the limit too', async () => {
    for (let i = 0; i < RATE_LIMIT; i++) {
      await expect(
        handler(namesEvent({ amount: '999' })),
      ).rejects.toMatchObject({ statusCode: 400 })
    }

    await expect(handler(namesEvent())).rejects.toMatchObject({
      statusCode: 429,
    })
  })

  it('tracks each IP separately', async () => {
    for (let i = 0; i < RATE_LIMIT; i++) {
      await handler(namesEvent())
    }

    const other = mockEvent({
      path: '/api/names',
      headers: { 'x-forwarded-for': '5.6.7.8' },
    })

    await expect(handler(other)).resolves.toHaveLength(1)
  })
})
