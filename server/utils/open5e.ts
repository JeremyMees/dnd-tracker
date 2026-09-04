import type { H3Error } from 'h3'
import { ONE_SECOND } from '~~/constants/time'

const OPEN5E_BASE = 'https://api.open5e.com/v2'

const UPSTREAM_TIMEOUT = ONE_SECOND * 8

const pathMap = new Map<Open5eType, string>([
  ['monsters', 'creatures'],
  ['spells', 'spells'],
  ['conditions', 'conditions'],
  ['magicitems', 'magicitems'],
  ['weapons', 'weapons'],
  ['armor', 'armor'],
  ['documents', 'documents'],
])

const excludeMap = new Map<Open5eType, string>([
  [
    'monsters',
    'document,speed,saving_throws,skill_bonuses,subcategory,creaturesets,environments,illustration',
  ],
  ['spells', 'document'],
  ['conditions', 'document'],
  ['magicitems', 'document'],
  ['weapons', 'document'],
  ['armor', 'document'],
])

export type Open5eQueryParams = Record<
  string,
  string | number | boolean | undefined | null
>

export function open5eUrl(type: Open5eType, params: Open5eQueryParams): string {
  const path = pathMap.get(type)

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported open5e type: ${type}`,
    })
  }

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    query.append(key, String(value))
  }

  query.sort()

  const search = query.toString()

  return `${OPEN5E_BASE}/${path}/${search ? `?${search}` : ''}`
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return (
    error.name === 'TimeoutError' ||
    (error.cause instanceof Error && error.cause.name === 'TimeoutError')
  )
}

function upstreamStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status

  return typeof status === 'number' ? status : undefined
}

export function open5eErrorToH3Error(error: unknown): Partial<H3Error> {
  if (isTimeout(error)) {
    return {
      statusCode: 504,
      statusMessage: 'Open5e did not respond in time',
      cause: error,
    }
  }

  const status = upstreamStatus(error)

  if (status === 404) {
    return { statusCode: 404, statusMessage: 'Not Found', cause: error }
  }

  if (status && status >= 500) {
    return {
      statusCode: 502,
      statusMessage: 'Open5e returned an invalid response',
      data: { upstreamStatus: status },
      cause: error,
    }
  }

  if (status && status >= 400) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { upstreamStatus: status },
      cause: error,
    }
  }

  return {
    statusCode: 503,
    statusMessage: 'Open5e is unavailable',
    cause: error,
  }
}

export async function fetchOpen5e<T>(
  type: Open5eType,
  params: Open5eQueryParams,
): Promise<Open5eResponse<T>> {
  const url = open5eUrl(type, { exclude: excludeMap.get(type), ...params })

  try {
    return await $fetch<Open5eResponse<T>>(url, {
      timeout: UPSTREAM_TIMEOUT,
      retry: false,
    })
  } catch (error) {
    throw createError(open5eErrorToH3Error(error))
  }
}
