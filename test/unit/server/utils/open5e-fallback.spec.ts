import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import {
  FILTERED_LIST_CACHE,
  STATIC_LIST_CACHE,
} from '~~/server/utils/cache-headers'

const { redisSet, redisGet } = vi.hoisted(() => ({
  redisSet: vi.fn(),
  redisGet: vi.fn(),
}))

const { redisConstructor } = vi.hoisted(() => ({
  redisConstructor: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    set = redisSet
    get = redisGet

    constructor(options: unknown) {
      redisConstructor(options)
    }
  },
}))

const { rememberOpen5e, recallOpen5e, withOpen5eFallback } =
  await import('~~/server/utils/open5e-fallback')

const NOW = Date.parse('2026-09-04T12:00:00Z')

function unavailable() {
  return { statusCode: 503, statusMessage: 'Open5e is unavailable' }
}

const CREDENTIALS = {
  public: {},
  open5eCacheUrl: 'https://example.upstash.io',
  open5eCacheToken: 'token-123',
}

describe('open5e fallback store', () => {
  beforeEach(() => {
    redisSet.mockReset().mockResolvedValue('OK')
    redisGet.mockReset().mockResolvedValue(null)
    redisConstructor.mockReset()
    mockRuntimeConfig(CREDENTIALS)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  describe('rememberOpen5e', () => {
    it('builds the client from the vercel supplied credentials', async () => {
      await rememberOpen5e('documents', [1])

      expect(redisConstructor).toHaveBeenCalledWith({
        url: 'https://example.upstash.io',
        token: 'token-123',
      })
    })

    it('namespaces the key and stamps when it was stored', async () => {
      vi.useFakeTimers().setSystemTime(new Date('2026-09-04T12:00:00Z'))

      await rememberOpen5e('documents', ['a'])

      expect(redisSet).toHaveBeenCalledWith(
        'open5e:documents',
        { payload: ['a'], storedAt: Date.parse('2026-09-04T12:00:00Z') },
        { ex: 2592000 },
      )

      vi.useRealTimers()
    })

    it('does nothing when the store is not configured', async () => {
      mockRuntimeConfig({ public: {} })

      await expect(rememberOpen5e('documents', [1])).resolves.toBeUndefined()

      expect(redisConstructor).not.toHaveBeenCalled()
      expect(redisSet).not.toHaveBeenCalled()
    })

    it('does nothing when only one credential is present', async () => {
      mockRuntimeConfig({ public: {}, open5eCacheUrl: 'https://example.io' })

      await rememberOpen5e('documents', [1])

      expect(redisSet).not.toHaveBeenCalled()
    })

    it('never lets a write failure break the caller', async () => {
      redisSet.mockRejectedValue(new Error('upstash down'))

      await expect(rememberOpen5e('documents', [1])).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('recallOpen5e', () => {
    it('returns the stored entry', async () => {
      const entry = { payload: ['a'], storedAt: 1 }

      redisGet.mockResolvedValue(entry)

      await expect(recallOpen5e('documents')).resolves.toEqual(entry)
      expect(redisGet).toHaveBeenCalledWith('open5e:documents')
    })

    it('returns nothing on a miss', async () => {
      redisGet.mockResolvedValue(null)

      await expect(recallOpen5e('documents')).resolves.toBeUndefined()
    })

    it('rejects an entry that lost its timestamp', async () => {
      redisGet.mockResolvedValue({ payload: ['a'] })

      await expect(recallOpen5e('documents')).resolves.toBeUndefined()
    })

    it('returns nothing when the store is not configured', async () => {
      mockRuntimeConfig({ public: {} })

      await expect(recallOpen5e('documents')).resolves.toBeUndefined()

      expect(redisGet).not.toHaveBeenCalled()
    })

    it('never lets a read failure mask the original error', async () => {
      redisGet.mockRejectedValue(new Error('upstash down'))

      await expect(recallOpen5e('documents')).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalled()
    })
  })
})

describe('withOpen5eFallback', () => {
  const load = vi.fn()

  beforeEach(() => {
    redisSet.mockReset().mockResolvedValue('OK')
    redisGet.mockReset().mockResolvedValue(null)
    load.mockReset().mockResolvedValue(['fresh'])
    mockRuntimeConfig(CREDENTIALS)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.useFakeTimers().setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function run(event = mockEvent(), tier = FILTERED_LIST_CACHE) {
    return withOpen5eFallback(event, { key: 'listing:spells', tier }, load)
  }

  it('serves a fresh entry from the store without touching open5e', async () => {
    redisGet.mockResolvedValue({ payload: ['stored'], storedAt: NOW - 60_000 })

    const event = mockEvent()

    await expect(run(event)).resolves.toEqual(['stored'])

    expect(load).not.toHaveBeenCalled()
    expect(responseHeader(event, 'X-Open5e-Source')).toBe('store')
  })

  it('shortens the edge lifetime by however long the entry has already lived', async () => {
    redisGet.mockResolvedValue({ payload: ['stored'], storedAt: NOW - 60_000 })

    const event = mockEvent()

    await run(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toContain('s-maxage=540')
  })

  it('honours the longer freshness window of the static tier', async () => {
    redisGet.mockResolvedValue({
      payload: ['stored'],
      storedAt: NOW - 3_600_000,
    })

    await expect(run(mockEvent(), STATIC_LIST_CACHE)).resolves.toEqual([
      'stored',
    ])

    expect(load).not.toHaveBeenCalled()
  })

  it('goes upstream once an entry falls outside the freshness window', async () => {
    redisGet.mockResolvedValue({
      payload: ['stored'],
      storedAt: NOW - 3_600_000,
    })

    const event = mockEvent()

    await expect(run(event)).resolves.toEqual(['fresh'])

    expect(load).toHaveBeenCalledOnce()
    expect(responseHeader(event, 'X-Open5e-Source')).toBe('upstream')
  })

  it('goes upstream when the store is empty', async () => {
    const event = mockEvent()

    await expect(run(event)).resolves.toEqual(['fresh'])

    expect(responseHeader(event, 'X-Open5e-Source')).toBe('upstream')
  })

  it('stores what it fetched for the next outage', async () => {
    await run()

    expect(redisSet).toHaveBeenCalledWith(
      'open5e:listing:spells',
      { payload: ['fresh'], storedAt: NOW },
      { ex: 2592000 },
    )
  })

  it('reads the store only once even when it falls back', async () => {
    redisGet.mockResolvedValue({
      payload: ['stored'],
      storedAt: NOW - 3_600_000,
    })
    load.mockRejectedValue(unavailable())

    await run()

    expect(redisGet).toHaveBeenCalledOnce()
  })

  it('serves a stale entry when open5e is unreachable', async () => {
    const storedAt = NOW - 3_600_000

    redisGet.mockResolvedValue({ payload: ['stored'], storedAt })
    load.mockRejectedValue(unavailable())

    const event = mockEvent()

    await expect(run(event)).resolves.toEqual(['stored'])

    expect(responseHeader(event, 'X-Open5e-Source')).toBe('stale')
    expect(responseHeader(event, 'X-Open5e-Stale-At')).toBe(
      new Date(storedAt).toISOString(),
    )
  })

  it('retries soon after serving stale rather than pinning it at the edge', async () => {
    redisGet.mockResolvedValue({
      payload: ['stored'],
      storedAt: NOW - 3_600_000,
    })
    load.mockRejectedValue(unavailable())

    const event = mockEvent()

    await run(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=60',
    )
  })

  it('rethrows when open5e is unreachable and nothing was ever stored', async () => {
    load.mockRejectedValue(unavailable())

    const event = mockEvent()

    await expect(run(event)).rejects.toMatchObject({ statusCode: 503 })

    expect(responseHeader(event, 'CDN-Cache-Control')).toBeUndefined()
  })

  it('refuses to hide our own bad request behind stale data', async () => {
    redisGet.mockResolvedValue({
      payload: ['stored'],
      storedAt: NOW - 3_600_000,
    })
    load.mockRejectedValue({ statusCode: 400, statusMessage: 'Bad Request' })

    await expect(run()).rejects.toMatchObject({ statusCode: 400 })
  })

  it('falls straight through to open5e when the store is not configured', async () => {
    mockRuntimeConfig({ public: {} })

    const event = mockEvent()

    await expect(run(event)).resolves.toEqual(['fresh'])

    expect(redisGet).not.toHaveBeenCalled()
    expect(responseHeader(event, 'X-Open5e-Source')).toBe('upstream')
  })

  it('still reaches open5e when the store itself is broken', async () => {
    redisGet.mockRejectedValue(new Error('upstash down'))

    await expect(run()).resolves.toEqual(['fresh'])
  })
})
