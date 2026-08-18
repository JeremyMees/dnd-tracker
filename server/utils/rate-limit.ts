import type { H3Event } from 'h3'

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export async function assertRateLimit(
  event: H3Event,
  { key, limit, windowMs }: RateLimitOptions,
): Promise<void> {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const storage = useStorage<RateLimitEntry>('rate-limit')
  const storageKey = `${key}:${ip}`
  const now = Date.now()
  const entry = await storage.getItem(storageKey)
  const active = entry && entry.resetAt > now ? entry : null

  if (active && active.count >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  }

  await storage.setItem(storageKey, {
    count: (active?.count ?? 0) + 1,
    resetAt: active?.resetAt ?? now + windowMs,
  })
}
