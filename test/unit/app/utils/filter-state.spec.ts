import { describe, expect, it } from 'vitest'

describe('filter-state', () => {
  describe('inferFilterCodec', () => {
    it('should round trip strings', () => {
      const codec = inferFilterCodec('')

      expect(codec.serialize('fire')).toBe('fire')
      expect(codec.parse('fire')).toBe('fire')
      expect(codec.parse('')).toBe('')
    })

    it('should round trip numbers', () => {
      const codec = inferFilterCodec(0)

      expect(codec.serialize(3)).toBe('3')
      expect(codec.parse('3')).toBe(3)
      expect(codec.parse('0.125')).toBe(0.125)
    })

    it('should reject values that are not numbers', () => {
      const codec = inferFilterCodec(0)

      expect(codec.parse('')).toBeUndefined()
      expect(codec.parse(' ')).toBeUndefined()
      expect(codec.parse('abc')).toBeUndefined()
      expect(codec.parse('Infinity')).toBeUndefined()
    })

    it('should round trip booleans', () => {
      const codec = inferFilterCodec(false)

      expect(codec.serialize(true)).toBe('true')
      expect(codec.parse('true')).toBe(true)
      expect(codec.parse('false')).toBe(false)
      expect(codec.parse('yes')).toBeUndefined()
    })

    it('should round trip string lists', () => {
      const codec = inferFilterCodec<string[]>([])

      expect(codec.serialize(['srd-2024', 'a5e'])).toBe('srd-2024,a5e')
      expect(codec.parse('srd-2024,a5e')).toStrictEqual(['srd-2024', 'a5e'])
    })

    it('should drop empty entries from string lists', () => {
      const codec = inferFilterCodec<string[]>([])

      expect(codec.parse('srd-2024, ,a5e,')).toStrictEqual(['srd-2024', 'a5e'])
      expect(codec.parse('')).toStrictEqual([])
    })

    it('should not parse unsupported types', () => {
      const codec = inferFilterCodec({ nested: true })

      expect(codec.parse('{}')).toBeUndefined()
    })
  })

  describe('oneOfFilterCodec', () => {
    it('should only parse allowed values', () => {
      const codec = oneOfFilterCodec(['name', '-hit_points'])

      expect(codec.parse('name')).toBe('name')
      expect(codec.parse('-hit_points')).toBe('-hit_points')
      expect(codec.parse('hit_points')).toBeUndefined()
    })

    it('should keep the type of the allowed value', () => {
      const codec = oneOfFilterCodec<number | string>(['all', 0.125, 2])

      expect(codec.parse('0.125')).toBe(0.125)
      expect(codec.parse('all')).toBe('all')
      expect(codec.serialize(2)).toBe('2')
    })
  })

  describe('isSameFilterValue', () => {
    it('should compare primitives', () => {
      expect(isSameFilterValue('a', 'a')).toBe(true)
      expect(isSameFilterValue('a', 'b')).toBe(false)
      expect(isSameFilterValue(0, 0)).toBe(true)
      expect(isSameFilterValue(0, '0')).toBe(false)
    })

    it('should compare arrays by content', () => {
      expect(isSameFilterValue(['a', 'b'], ['a', 'b'])).toBe(true)
      expect(isSameFilterValue(['a', 'b'], ['b', 'a'])).toBe(false)
      expect(isSameFilterValue(['a'], ['a', 'b'])).toBe(false)
      expect(isSameFilterValue([], [])).toBe(true)
    })

    it('should not match an array against a primitive', () => {
      expect(isSameFilterValue(['a'], 'a')).toBe(false)
      expect(isSameFilterValue('a', ['a'])).toBe(false)
    })
  })

  describe('sanitizeFilterValue', () => {
    it('should accept values the codec understands', () => {
      expect(sanitizeFilterValue(inferFilterCodec(0), 3)).toBe(3)
      expect(
        sanitizeFilterValue(inferFilterCodec<string[]>([]), ['a', 'b']),
      ).toStrictEqual(['a', 'b'])
    })

    it('should reject values the codec rejects', () => {
      expect(
        sanitizeFilterValue(oneOfFilterCodec(['spells']), 'monsters'),
      ).toBeUndefined()
      expect(sanitizeFilterValue(inferFilterCodec(0), 'abc')).toBeUndefined()
      expect(sanitizeFilterValue(inferFilterCodec(false), 1)).toBeUndefined()
    })

    it('should reject values that break the codec', () => {
      expect(
        sanitizeFilterValue(inferFilterCodec<string[]>([]), 'a,b'),
      ).toBeUndefined()
    })
  })
})
