import type { H3Event } from 'h3'
import {
  ONE_DAY,
  ONE_MINUTE,
  ONE_SECOND,
  ONE_WEEK,
  TEN_MINUTES,
} from '~~/constants/time'

const MAX_AGE_CEILING = 31536000

export interface CacheTier {
  maxAge: number
  staleWhileRevalidate: number
  staleIfError: number
}

export const STATIC_LIST_CACHE: CacheTier = {
  maxAge: ONE_DAY,
  staleWhileRevalidate: ONE_WEEK,
  staleIfError: ONE_WEEK,
}

export const FILTERED_LIST_CACHE: CacheTier = {
  maxAge: TEN_MINUTES,
  staleWhileRevalidate: ONE_DAY,
  staleIfError: ONE_WEEK,
}

export const STALE_FALLBACK_CACHE: CacheTier = {
  maxAge: ONE_MINUTE,
  staleWhileRevalidate: 0,
  staleIfError: 0,
}

function seconds(ms: number): number {
  return Math.min(MAX_AGE_CEILING, Math.max(0, Math.floor(ms / ONE_SECOND)))
}

export function cdnCacheControl(tier: CacheTier): string {
  const directives = ['public', `s-maxage=${seconds(tier.maxAge)}`]

  if (seconds(tier.staleWhileRevalidate) > 0) {
    directives.push(
      `stale-while-revalidate=${seconds(tier.staleWhileRevalidate)}`,
    )
  }

  if (seconds(tier.staleIfError) > 0) {
    directives.push(`stale-if-error=${seconds(tier.staleIfError)}`)
  }

  return directives.join(', ')
}

export function setCacheHeaders(event: H3Event, tier: CacheTier): void {
  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  setHeader(event, 'CDN-Cache-Control', cdnCacheControl(tier))
}
