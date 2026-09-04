import { describe, expect, it } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import {
  cdnCacheControl,
  FILTERED_LIST_CACHE,
  setCacheHeaders,
  STATIC_LIST_CACHE,
} from '~~/server/utils/cache-headers'

describe('cdnCacheControl', () => {
  it('converts the static tier from milliseconds to seconds', () => {
    expect(cdnCacheControl(STATIC_LIST_CACHE)).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('converts the filtered tier from milliseconds to seconds', () => {
    expect(cdnCacheControl(FILTERED_LIST_CACHE)).toBe(
      'public, s-maxage=600, stale-while-revalidate=86400, stale-if-error=604800',
    )
  })

  it('caches the filtered tier for less time than the static tier', () => {
    expect(FILTERED_LIST_CACHE.maxAge).toBeLessThan(STATIC_LIST_CACHE.maxAge)
  })

  it('keeps serving stale for longer than it stays fresh on both tiers', () => {
    for (const tier of [STATIC_LIST_CACHE, FILTERED_LIST_CACHE]) {
      expect(tier.staleIfError).toBeGreaterThan(tier.maxAge)
    }
  })

  it('omits the stale windows when there are none', () => {
    expect(
      cdnCacheControl({
        maxAge: 60_000,
        staleWhileRevalidate: 0,
        staleIfError: 0,
      }),
    ).toBe('public, s-maxage=60')
  })

  it('omits stale windows that round down to nothing', () => {
    expect(
      cdnCacheControl({
        maxAge: 60_000,
        staleWhileRevalidate: 400,
        staleIfError: 400,
      }),
    ).toBe('public, s-maxage=60')
  })

  it('keeps a stale-if-error window without a revalidate window', () => {
    expect(
      cdnCacheControl({
        maxAge: 60_000,
        staleWhileRevalidate: 0,
        staleIfError: 60_000,
      }),
    ).toBe('public, s-maxage=60, stale-if-error=60')
  })

  it('floors sub-second precision', () => {
    expect(
      cdnCacheControl({
        maxAge: 1500,
        staleWhileRevalidate: 2900,
        staleIfError: 0,
      }),
    ).toBe('public, s-maxage=1, stale-while-revalidate=2')
  })

  it('never emits a negative age', () => {
    expect(
      cdnCacheControl({
        maxAge: -1000,
        staleWhileRevalidate: -1000,
        staleIfError: -1000,
      }),
    ).toBe('public, s-maxage=0')
  })

  it('clamps to the one year ceiling vercel accepts', () => {
    expect(
      cdnCacheControl({
        maxAge: 40_000_000_000,
        staleWhileRevalidate: 0,
        staleIfError: 0,
      }),
    ).toBe('public, s-maxage=31536000')
  })
})

describe('setCacheHeaders', () => {
  it('caches at the cdn but not in the browser', () => {
    const event = mockEvent()

    setCacheHeaders(event, STATIC_LIST_CACHE)

    expect(responseHeader(event, 'Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    )
    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('keeps every shared-cache directive out of the browser header', () => {
    const event = mockEvent()

    setCacheHeaders(event, FILTERED_LIST_CACHE)

    const browser = responseHeader(event, 'Cache-Control')

    expect(browser).not.toContain('s-maxage')
    expect(browser).not.toContain('stale-while-revalidate')
    expect(browser).not.toContain('stale-if-error')
  })
})
