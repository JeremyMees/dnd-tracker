import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { sbRange, sbPages, sbCount, sbQuery, sbOrQuery } from '~/utils/supabase'
import type { SbFetchOptions } from '~~/shared/types/supabase'

let mockQueryResult: any = {
  data: [{ id: 1 }, { id: 2 }],
  error: null,
  count: 2,
}

mockNuxtImport('createError', () => (error: any) => {
  throw new Error(
    typeof error === 'string'
      ? error
      : error.message || error.details || 'Unknown error',
  )
})

mockNuxtImport('useSupabaseClient', () => {
  return () => ({
    from: () => ({
      select: () => {
        const query = {
          range: () => ({
            order: () => ({
              eq: () => ({
                or: () => mockQueryResult,
              }),
              or: () => mockQueryResult,
            }),
            eq: () => ({
              or: () => mockQueryResult,
            }),
            or: () => mockQueryResult,
          }),
          order: () => ({
            range: () => ({
              eq: () => ({
                or: () => mockQueryResult,
              }),
              or: () => mockQueryResult,
            }),
            eq: () => ({
              or: () => mockQueryResult,
            }),
            or: () => mockQueryResult,
          }),
          eq: () => ({
            or: () => mockQueryResult,
          }),
          or: () => mockQueryResult,
        }

        return { ...query, ...mockQueryResult }
      },
    }),
  })
})

describe('supabase', () => {
  describe('sbRange', () => {
    it('should calculate correct range for page 0', () => {
      const result = sbRange(0, 10)
      expect(result).toEqual({ from: 0, to: 9 })
    })

    it('should calculate correct range for page 1', () => {
      const result = sbRange(1, 10)
      expect(result).toEqual({ from: 10, to: 19 })
    })

    it('should calculate correct range for page 2', () => {
      const result = sbRange(2, 10)
      expect(result).toEqual({ from: 20, to: 29 })
    })

    it('should handle small perPage values', () => {
      const result = sbRange(5, 2)
      expect(result).toEqual({ from: 10, to: 11 })
    })
  })

  describe('sbPages', () => {
    it('should calculate correct number of pages', () => {
      expect(sbPages(100, 10)).toBe(10)
      expect(sbPages(101, 10)).toBe(11)
      expect(sbPages(99, 10)).toBe(10)
    })

    it('should handle zero count', () => {
      expect(sbPages(0, 10)).toBe(1)
    })

    it('should handle null count', () => {
      expect(sbPages(null, 10)).toBe(1)
    })

    it('should handle small perPage values', () => {
      expect(sbPages(100, 1)).toBe(100)
    })

    it('should round up fractional pages', () => {
      expect(sbPages(101, 20)).toBe(6)
    })
  })

  describe('sbOrQuery', () => {
    it('should create a valid query string for single field', () => {
      const result = sbOrQuery(['title'], 'test')
      expect(result).toBe('title.ilike.*test*')
    })

    it('should create a valid query string for multiple fields', () => {
      const result = sbOrQuery(['title', 'description'], 'test')
      expect(result).toBe('title.ilike.*test*,description.ilike.*test*')
    })

    it('should escape special characters', () => {
      const result = sbOrQuery(['title'], 'test%_')
      expect(result).toBe('title.ilike.*test\\%\\_*')
    })

    it('should handle empty keys array', () => {
      const result = sbOrQuery([], 'test')
      expect(result).toBe('')
    })
  })

  describe('sbCount', () => {
    it('should return correct count from array', () => {
      const obj = { items: [{ count: 5 }] }

      expect(sbCount('items', obj)).toBe(5)
    })

    it('should return 0 for empty array', () => {
      const obj = { items: [] }

      expect(sbCount('items', obj)).toBe(0)
    })

    it('should return 0 for non-existent key', () => {
      const obj = { otherItems: [{ count: 5 }] }

      expect(sbCount('items', obj)).toBe(0)
    })

    it('should return 0 for non-array value', () => {
      const obj = { items: 'not an array' }

      expect(sbCount('items', obj)).toBe(0)
    })
  })

  describe('sbQuery', () => {
    beforeEach(() => {
      mockQueryResult = {
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        count: 2,
      }
    })

    it('should throw error when DB returns error', async () => {
      mockQueryResult = {
        data: null,
        error: new Error('DB error'),
        count: 0,
      }

      const options: SbFetchOptions = {
        table: 'profiles',
      }

      await expect(sbQuery(options)).rejects.toThrow('DB error')
    })
  })
})
