import type { H3Event } from 'h3'
import { Redis } from '@upstash/redis'
import { ONE_DAY, ONE_SECOND } from '~~/constants/time'

const KEY_PREFIX = 'open5e:'
const FALLBACK_TTL = ONE_DAY * 30

export interface Open5eFallback<T> {
  payload: T
  storedAt: number
}

function createClient(): Redis | null {
  const { open5eCacheUrl, open5eCacheToken } = useRuntimeConfig()

  if (!open5eCacheUrl || !open5eCacheToken) return null

  return new Redis({
    url: open5eCacheUrl as string,
    token: open5eCacheToken as string,
  })
}

export async function rememberOpen5e<T>(
  key: string,
  payload: T,
): Promise<void> {
  const redis = createClient()

  if (!redis) return

  const entry: Open5eFallback<T> = { payload, storedAt: Date.now() }

  try {
    await redis.set(`${KEY_PREFIX}${key}`, entry, {
      ex: Math.floor(FALLBACK_TTL / ONE_SECOND),
    })
  } catch (error) {
    console.error('Failed to store the open5e fallback:', error)
  }
}

export async function recallOpen5e<T>(
  key: string,
): Promise<Open5eFallback<T> | undefined> {
  const redis = createClient()

  if (!redis) return

  try {
    const entry = await redis.get<Open5eFallback<T>>(`${KEY_PREFIX}${key}`)

    if (!entry || typeof entry.storedAt !== 'number') return

    return entry
  } catch (error) {
    console.error('Failed to read the open5e fallback:', error)

    return undefined
  }
}

export async function withOpen5eFallback<T>(
  event: H3Event,
  { key, tier }: { key: string; tier: CacheTier },
  load: () => Promise<T>,
): Promise<T> {
  const cached = await recallOpen5e<T>(key)
  const age = cached ? Date.now() - cached.storedAt : Infinity

  if (cached && age < tier.maxAge) {
    setCacheHeaders(event, { ...tier, maxAge: tier.maxAge - age })
    setHeader(event, 'X-Open5e-Source', 'store')

    return cached.payload
  }

  try {
    const payload = await load()

    await rememberOpen5e(key, payload)

    setCacheHeaders(event, tier)
    setHeader(event, 'X-Open5e-Source', 'upstream')

    return payload
  } catch (error) {
    if (!isOpen5eUnavailable(error) || !cached) throw error

    setCacheHeaders(event, STALE_FALLBACK_CACHE)
    setHeader(event, 'X-Open5e-Source', 'stale')
    setHeader(
      event,
      'X-Open5e-Stale-At',
      new Date(cached.storedAt).toISOString(),
    )

    return cached.payload
  }
}
