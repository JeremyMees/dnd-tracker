import type { PostgrestError } from '@supabase/supabase-js'
import type { H3Error } from 'h3'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

// PostgREST error codes: https://docs.postgrest.org/en/v12/references/errors.html
const POSTGREST_CODES: Record<string, number> = {
  PGRST100: 400, // unparseable query string
  PGRST102: 400, // invalid body
  PGRST103: 400, // invalid range
  PGRST106: 404, // schema not exposed
  PGRST108: 400, // filter on a missing embedded resource
  PGRST116: 404, // single() matched 0 or more than 1 row
  PGRST200: 400, // embedded relationship not found
  PGRST202: 404, // function not found
  PGRST204: 400, // column not found
  PGRST301: 401, // expired or invalid JWT
  PGRST302: 401, // no JWT provided
}

// Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const POSTGRES_CODES: Record<string, number> = {
  '08000': 503, // connection exception
  '08003': 503, // connection does not exist
  '08006': 503, // connection failure
  '22001': 400, // string data right truncation
  '22003': 400, // numeric value out of range
  '22007': 400, // invalid datetime format
  '22P02': 400, // invalid text representation
  '23000': 409, // integrity constraint violation
  '23001': 409, // restrict violation
  '23502': 400, // not null violation
  '23503': 409, // foreign key violation
  '23505': 409, // unique violation
  '23514': 400, // check violation
  '23P01': 409, // exclusion violation
  '40001': 409, // serialization failure
  '40P01': 409, // deadlock detected
  '42501': 403, // insufficient privilege (RLS)
  '42703': 400, // undefined column
  '42883': 400, // undefined function
  '53300': 503, // too many connections
  '57014': 504, // query canceled
  P0001: 400, // raise_exception from a trigger or function
  P0002: 404, // no data found
}

export function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'code' in value &&
    'details' in value &&
    'hint' in value
  )
}

export function postgrestStatusCode(error: PostgrestError): number {
  return POSTGREST_CODES[error.code] ?? POSTGRES_CODES[error.code] ?? 500
}

export function postgresErrorToH3Error(
  error: PostgrestError,
  options: { statusCode?: number; statusMessage?: string } = {},
): Partial<H3Error> {
  const statusCode = options.statusCode ?? postgrestStatusCode(error)

  return {
    statusCode,
    statusMessage:
      options.statusMessage ??
      STATUS_MESSAGES[statusCode] ??
      'Internal Server Error',
    data: { code: error.code },
    cause: error,
  }
}
