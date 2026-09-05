import type { H3Error } from 'h3'

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

const UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export function isOpen5eUnavailable(error: unknown): boolean {
  const statusCode = (error as { statusCode?: unknown } | null)?.statusCode

  return typeof statusCode === 'number' && UNAVAILABLE_STATUSES.has(statusCode)
}

export async function fetchOpen5e<T>(
  type: Open5eType,
  params: Open5eQueryParams,
): Promise<Open5eResponse<T>> {
  let url: string

  try {
    url = open5eUrl(type, { exclude: excludeMap.get(type), ...params })
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: getErrorMessage(error),
      cause: error,
    })
  }

  try {
    return await $fetch<Open5eResponse<T>>(url, {
      timeout: OPEN5E_TIMEOUT,
      retry: false,
    })
  } catch (error) {
    throw createError(open5eErrorToH3Error(error))
  }
}
