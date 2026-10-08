export function getErrorMessage(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'statusMessage' in error.data &&
    typeof error.data.statusMessage === 'string'
  ) {
    return error.data.statusMessage
  }

  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return undefined
}

export type FailureReason =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'rejected'

function readProp(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined
  }

  return (value as Record<string, unknown>)[key]
}

export function getFailureReason(error: unknown): FailureReason {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline'
  }

  const statusCode = readProp(error, 'statusCode') ?? readProp(error, 'status')
  const code =
    readProp(readProp(error, 'cause'), 'code') ??
    readProp(readProp(error, 'data'), 'code')

  if (statusCode === 401 || code === 'PGRST301' || code === 'PGRST302') {
    return 'unauthorized'
  }

  if (statusCode === 403 || code === '42501') return 'forbidden'
  if (statusCode === 404 || code === 'PGRST116') return 'notFound'
  if (statusCode === 429) return 'rateLimited'

  if (readProp(error, 'name') === 'FetchError' && statusCode === undefined) {
    return 'offline'
  }

  return 'rejected'
}
