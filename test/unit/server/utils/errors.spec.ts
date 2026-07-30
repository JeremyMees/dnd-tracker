import { describe, expect, it } from 'vitest'
import { PostgrestError } from '@supabase/supabase-js'
import {
  isPostgrestError,
  postgresErrorToH3Error,
  postgrestStatusCode,
} from '~~/server/utils/errors'

function pgError(code: string, overrides: Partial<PostgrestError> = {}) {
  return new PostgrestError({
    message: 'insert or update on table "team" violates foreign key constraint',
    details: 'Key (campaign)=(42) is not present in table "campaigns".',
    hint: 'Verify the campaign exists before inserting.',
    code,
    ...overrides,
  })
}

describe('errors', () => {
  describe('isPostgrestError', () => {
    it('accepts a PostgrestError instance', () => {
      expect(isPostgrestError(pgError('23505'))).toBe(true)
    })

    it('accepts a plain object with the postgrest error shape', () => {
      expect(
        isPostgrestError({
          message: 'boom',
          details: '',
          hint: '',
          code: '23505',
        }),
      ).toBe(true)
    })

    it('rejects errors without the postgrest fields', () => {
      expect(isPostgrestError(new Error('boom'))).toBe(false)
      expect(isPostgrestError({ message: 'boom', code: '23505' })).toBe(false)
    })

    it('rejects non-objects', () => {
      expect(isPostgrestError(null)).toBe(false)
      expect(isPostgrestError(undefined)).toBe(false)
      expect(isPostgrestError('23505')).toBe(false)
      expect(isPostgrestError(500)).toBe(false)
    })
  })

  describe('postgrestStatusCode', () => {
    it('maps postgrest codes', () => {
      expect(postgrestStatusCode(pgError('PGRST116'))).toBe(404)
      expect(postgrestStatusCode(pgError('PGRST202'))).toBe(404)
      expect(postgrestStatusCode(pgError('PGRST204'))).toBe(400)
      expect(postgrestStatusCode(pgError('PGRST301'))).toBe(401)
    })

    it('maps postgres constraint violations to conflicts', () => {
      expect(postgrestStatusCode(pgError('23505'))).toBe(409)
      expect(postgrestStatusCode(pgError('23503'))).toBe(409)
      expect(postgrestStatusCode(pgError('23P01'))).toBe(409)
      expect(postgrestStatusCode(pgError('40P01'))).toBe(409)
    })

    it('maps bad input to 400', () => {
      expect(postgrestStatusCode(pgError('22P02'))).toBe(400)
      expect(postgrestStatusCode(pgError('23502'))).toBe(400)
      expect(postgrestStatusCode(pgError('P0001'))).toBe(400)
    })

    it('maps a row level security denial to 403', () => {
      expect(postgrestStatusCode(pgError('42501'))).toBe(403)
    })

    it('maps unavailability and timeouts to 5xx', () => {
      expect(postgrestStatusCode(pgError('08006'))).toBe(503)
      expect(postgrestStatusCode(pgError('53300'))).toBe(503)
      expect(postgrestStatusCode(pgError('57014'))).toBe(504)
    })

    it('falls back to 500 for unknown or empty codes', () => {
      expect(postgrestStatusCode(pgError('42P01'))).toBe(500)
      expect(postgrestStatusCode(pgError('not-a-code'))).toBe(500)
      expect(postgrestStatusCode(pgError(''))).toBe(500)
    })
  })

  describe('postgresErrorToH3Error', () => {
    it('derives the status code and a generic status message', () => {
      expect(postgresErrorToH3Error(pgError('23505'))).toMatchObject({
        statusCode: 409,
        statusMessage: 'Conflict',
      })

      expect(postgresErrorToH3Error(pgError('PGRST116'))).toMatchObject({
        statusCode: 404,
        statusMessage: 'Not Found',
      })

      expect(postgresErrorToH3Error(pgError('42501'))).toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden',
      })
    })

    it('falls back to 500 for an unknown code', () => {
      expect(postgresErrorToH3Error(pgError('nope'))).toMatchObject({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
      })
    })

    it('exposes the error code but never the database internals', () => {
      const error = pgError('23503')

      expect(postgresErrorToH3Error(error)).toEqual({
        statusCode: 409,
        statusMessage: 'Conflict',
        data: { code: '23503' },
        cause: error,
      })
    })

    it('keeps the original error as cause for logging', () => {
      const error = pgError('23505')
      const { cause } = postgresErrorToH3Error(error)

      expect(cause).toBe(error)
      expect((cause as PostgrestError).hint).toBe(
        'Verify the campaign exists before inserting.',
      )
    })

    it('honours a status code override and matches its message', () => {
      expect(
        postgresErrorToH3Error(pgError('23505'), { statusCode: 403 }),
      ).toMatchObject({ statusCode: 403, statusMessage: 'Forbidden' })
    })

    it('honours a status message override', () => {
      expect(
        postgresErrorToH3Error(pgError('PGRST116'), {
          statusMessage: 'Encounter not found',
        }),
      ).toMatchObject({ statusCode: 404, statusMessage: 'Encounter not found' })
    })

    it('honours both overrides together', () => {
      expect(
        postgresErrorToH3Error(pgError('nope'), {
          statusCode: 400,
          statusMessage: 'Invalid campaign',
        }),
      ).toMatchObject({ statusCode: 400, statusMessage: 'Invalid campaign' })
    })
  })
})
