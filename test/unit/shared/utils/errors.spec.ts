import { describe, expect, it } from 'vitest'
import { PostgrestError } from '@supabase/supabase-js'
import { getErrorMessage } from '~~/shared/utils/errors'

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
        new Error('[POST] "/api/live/start": 403 Forbidden'),
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
