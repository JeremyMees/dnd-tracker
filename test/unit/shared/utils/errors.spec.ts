import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthApiError, PostgrestError } from '@supabase/supabase-js'
import { createError } from 'h3'
import { FetchError } from 'ofetch'
import { getErrorMessage, getFailureReason } from '~~/shared/utils/errors'

describe('getErrorMessage', () => {
  describe('Error instances', () => {
    it('reads the message off a plain Error', () => {
      expect(getErrorMessage(new Error('foo'))).toBe('foo')
    })

    it('reads the message off an Error subclass', () => {
      expect(getErrorMessage(new TypeError('bad type'))).toBe('bad type')
    })

    it('reads the message off a Supabase PostgrestError', () => {
      const error = new PostgrestError({
        message: 'violates foreign key constraint',
        details: '',
        hint: '',
        code: '23503',
      })

      expect(getErrorMessage(error)).toBe('violates foreign key constraint')
    })

    it('preserves an empty message rather than discarding it', () => {
      expect(getErrorMessage(new Error(''))).toBe('')
    })
  })

  describe('thrown strings', () => {
    it('returns the string itself', () => {
      expect(getErrorMessage('something failed')).toBe('something failed')
    })

    it('returns an empty string unchanged', () => {
      expect(getErrorMessage('')).toBe('')
    })
  })

  describe('ofetch FetchError instances', () => {
    it('prefers the server statusMessage over the generic ofetch message', () => {
      const error = Object.assign(
        new Error('[POST] "/api/encounter/live/start": 403 Forbidden'),
        {
          data: {
            statusCode: 403,
            statusMessage: 'Live sessions require a pro subscription',
          },
        },
      )

      expect(getErrorMessage(error)).toBe(
        'Live sessions require a pro subscription',
      )
    })

    it('falls back to the generic message when data has no statusMessage', () => {
      const error = Object.assign(new Error('network error'), {
        data: { statusCode: 500 },
      })

      expect(getErrorMessage(error)).toBe('network error')
    })
  })

  describe('error-like objects', () => {
    it('reads message off a plain object', () => {
      expect(
        getErrorMessage({
          message: 'duplicate key value',
          details: null,
          hint: null,
          code: '23505',
        }),
      ).toBe('duplicate key value')
    })

    it('ignores a non-string message', () => {
      expect(getErrorMessage({ message: 500 })).toBeUndefined()
      expect(getErrorMessage({ message: null })).toBeUndefined()
      expect(getErrorMessage({ message: { nested: 'x' } })).toBeUndefined()
    })

    it('returns undefined when there is no message key', () => {
      expect(getErrorMessage({ code: '23505' })).toBeUndefined()
      expect(getErrorMessage({})).toBeUndefined()
    })
  })

  describe('values carrying no message', () => {
    it('returns undefined for nullish input', () => {
      expect(getErrorMessage(null)).toBeUndefined()
      expect(getErrorMessage(undefined)).toBeUndefined()
    })

    it('returns undefined for other primitives', () => {
      expect(getErrorMessage(404)).toBeUndefined()
      expect(getErrorMessage(false)).toBeUndefined()
    })

    it('returns undefined for arrays and functions', () => {
      expect(getErrorMessage(['foo'])).toBeUndefined()
      expect(getErrorMessage(() => 'foo')).toBeUndefined()
    })
  })
})

describe('getFailureReason', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function httpError(statusCode: number, data?: Record<string, unknown>) {
    return Object.assign(new FetchError('request failed'), { statusCode, data })
  }

  function postgrestError(code: string) {
    return createError({
      message: 'failed',
      cause: new PostgrestError({
        message: 'failed',
        details: '',
        hint: '',
        code,
      }),
    })
  }

  it('reports offline when the browser has no connection', () => {
    vi.stubGlobal('navigator', { onLine: false })

    expect(getFailureReason(httpError(500))).toBe('offline')
  })

  it('reports offline for a fetch that never got a response', () => {
    expect(getFailureReason(new FetchError('fetch failed'))).toBe('offline')
  })

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [429, 'rateLimited'],
    [400, 'rejected'],
    [500, 'rejected'],
  ])('maps http status %i to %s', (statusCode, reason) => {
    expect(getFailureReason(httpError(statusCode))).toBe(reason)
  })

  it.each([
    ['42501', 'forbidden'],
    ['PGRST116', 'notFound'],
    ['PGRST301', 'unauthorized'],
    ['23514', 'rejected'],
  ])('maps postgres code %s to %s', (code, reason) => {
    expect(getFailureReason(postgrestError(code))).toBe(reason)
  })

  it('reads the status a supabase auth error carries', () => {
    expect(
      getFailureReason(
        new AuthApiError('Too many requests', 429, 'over_request_rate_limit'),
      ),
    ).toBe('rateLimited')
  })

  it('reads the postgres code a server route forwards in data', () => {
    expect(getFailureReason(createError({ data: { code: '42501' } }))).toBe(
      'forbidden',
    )
  })

  it('falls back to rejected for values that are not errors', () => {
    expect(getFailureReason('boom')).toBe('rejected')
    expect(getFailureReason(null)).toBe('rejected')
  })
})
