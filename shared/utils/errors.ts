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

function errorCode(error: unknown): unknown {
  const data = readProp(error, 'data')

  return (
    readProp(readProp(error, 'cause'), 'code') ??
    readProp(readProp(data, 'data'), 'code') ??
    readProp(data, 'code') ??
    readProp(error, 'code')
  )
}

export function getFailureReason(error: unknown): FailureReason {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline'
  }

  const statusCode = readProp(error, 'statusCode') ?? readProp(error, 'status')
  const code = errorCode(error)

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

export type AuthFailure =
  | 'emailInUse'
  | 'emailInvalid'
  | 'weakPassword'
  | 'samePassword'
  | 'sessionExpired'
  | 'invalidCredentials'
  | 'emailNotConfirmed'

const AUTH_FAILURES: Record<string, AuthFailure> = {
  user_already_exists: 'emailInUse',
  email_exists: 'emailInUse',
  email_address_invalid: 'emailInvalid',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  session_not_found: 'sessionExpired',
  session_expired: 'sessionExpired',
  reauthentication_needed: 'sessionExpired',
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
}

export function getAuthFailure(error: unknown): AuthFailure | undefined {
  const name =
    readProp(readProp(error, 'cause'), 'name') ?? readProp(error, 'name')

  if (name === 'AuthSessionMissingError') return 'sessionExpired'

  const code = errorCode(error)

  return typeof code === 'string' ? AUTH_FAILURES[code] : undefined
}

export function failureMessageKey(error: unknown): string {
  const authFailure = getAuthFailure(error)

  return authFailure
    ? `general.error.auth.${authFailure}`
    : `general.error.reasons.${getFailureReason(error)}`
}
