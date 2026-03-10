import { describe, expect, it } from 'vitest'
import {
  removeEmptyKeys,
  getValueFromNestedKeys,
  flattenObject,
} from '~/utils/object-utils'

describe('object-utils', () => {
  describe('removeEmptyKeys', () => {
    it('should remove keys with null or undefined values', () => {
      const input = {
        name: 'John',
        age: 30,
        email: undefined,
        phone: null,
        address: 'New York',
      }

      const expected = {
        name: 'John',
        age: 30,
        address: 'New York',
      }

      expect(removeEmptyKeys(input)).toEqual(expected)
    })

    it('should handle nested objects when deep is true', () => {
      const input = {
        name: 'John',
        contact: {
          email: undefined,
          phone: '123-456-7890',
          socialMedia: null,
        },
        address: {
          city: 'New York',
          state: undefined,
        },
      }

      const expected = {
        name: 'John',
        contact: {
          phone: '123-456-7890',
        },
        address: {
          city: 'New York',
        },
      }

      expect(removeEmptyKeys(input, true)).toEqual(expected)
    })

    it('should preserve arrays', () => {
      const input = {
        items: [1, 2, 3],
        emptyProp: null,
      }

      const expected = {
        items: [1, 2, 3],
      }

      expect(removeEmptyKeys(input)).toEqual(expected)
    })
  })

  describe('getValueFromNestedKeys', () => {
    it('should retrieve value from a nested path', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            age: 30,
          },
        },
      }

      expect(getValueFromNestedKeys(obj, 'user.profile.name')).toBe('John')
      expect(getValueFromNestedKeys(obj, 'user.profile.age')).toBe(30)
    })

    it('should return undefined for non-existent paths', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
          },
        },
      }

      expect(getValueFromNestedKeys(obj, 'user.settings')).toBeUndefined()
      expect(getValueFromNestedKeys(obj, 'user.profile.email')).toBeUndefined()
    })

    it('should handle empty objects', () => {
      const obj = {}

      expect(getValueFromNestedKeys(obj, 'user.name')).toBeUndefined()
    })
  })

  describe('flattenObject', () => {
    it('should flatten nested objects into a single level object', () => {
      const obj = {
        user: {
          name: 'John',
          profile: {
            age: 30,
          },
        },
        status: 'active',
      }

      const expected = {
        name: 'John',
        age: 30,
        status: 'active',
      }

      expect(flattenObject(obj)).toEqual(expected)
    })

    it('should preserve arrays', () => {
      const obj = {
        user: {
          hobbies: ['reading', 'gaming'],
          profile: {
            skills: ['JavaScript', 'TypeScript'],
          },
        },
      }

      const expected = {
        hobbies: ['reading', 'gaming'],
        skills: ['JavaScript', 'TypeScript'],
      }

      expect(flattenObject(obj)).toEqual(expected)
    })

    it('should handle empty objects', () => {
      const obj = {}

      expect(flattenObject(obj)).toEqual({})
    })
  })
})
