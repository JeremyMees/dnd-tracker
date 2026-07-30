import { describe, expect, it } from 'vitest'

describe('parse', () => {
  describe('normalizeKey', () => {
    it('lowercases and trims the input', () => {
      expect(normalizeKey('  Hello World  ')).toBe('hello world')
      expect(normalizeKey('UPPER')).toBe('upper')
      expect(normalizeKey('already lowercase')).toBe('already lowercase')
    })

    it('returns empty string for null, undefined, or empty', () => {
      expect(normalizeKey(null)).toBe('')
      expect(normalizeKey(undefined)).toBe('')
      expect(normalizeKey('')).toBe('')
    })
  })

  describe('splitList', () => {
    it('splits on commas', () => {
      expect(splitList('a, b, c')).toEqual(['a', 'b', 'c'])
    })

    it('splits on semicolons', () => {
      expect(splitList('a; b; c')).toEqual(['a', 'b', 'c'])
    })

    it('trims each item and filters empty entries', () => {
      expect(splitList('  foo  ,  bar  ')).toEqual(['foo', 'bar'])
      expect(splitList('a,,b')).toEqual(['a', 'b'])
    })

    it('returns empty array for falsy input', () => {
      expect(splitList(null)).toEqual([])
      expect(splitList(undefined)).toEqual([])
      expect(splitList('')).toEqual([])
    })
  })

  describe('parseNumber', () => {
    it('returns numeric values as-is', () => {
      expect(parseNumber(5)).toBe(5)
      expect(parseNumber(0)).toBe(0)
      expect(parseNumber(-3.5)).toBe(-3.5)
    })

    it('returns fallback for non-finite numbers', () => {
      expect(parseNumber(Number.NaN)).toBe(0)
      expect(parseNumber(Infinity)).toBe(0)
      expect(parseNumber(Number.NaN, 99)).toBe(99)
    })

    it('parses integer and float strings', () => {
      expect(parseNumber('10')).toBe(10)
      expect(parseNumber('3.14')).toBe(3.14)
      expect(parseNumber('-7')).toBe(-7)
    })

    it('parses fraction strings like "1/2"', () => {
      expect(parseNumber('1/2')).toBe(0.5)
      expect(parseNumber('1/4')).toBe(0.25)
      expect(parseNumber('3/4')).toBe(0.75)
    })

    it('returns fallback for invalid strings', () => {
      expect(parseNumber('abc')).toBe(0)
      expect(parseNumber('')).toBe(0)
      expect(parseNumber('   ')).toBe(0)
      expect(parseNumber('abc', 5)).toBe(5)
    })

    it('returns fallback for null and undefined', () => {
      expect(parseNumber(null)).toBe(0)
      expect(parseNumber(undefined)).toBe(0)
      expect(parseNumber(null, 42)).toBe(42)
    })
  })

  describe('parseInteger', () => {
    it('returns integer numbers as-is', () => {
      expect(parseInteger(5)).toBe(5)
      expect(parseInteger(0)).toBe(0)
      expect(parseInteger(-7)).toBe(-7)
    })

    it('rounds float numbers to the nearest integer', () => {
      expect(parseInteger(5.6)).toBe(6)
      expect(parseInteger(5.4)).toBe(5)
      expect(parseInteger(-3.5)).toBe(-3)
    })

    it('parses and rounds integer and float strings', () => {
      expect(parseInteger('15')).toBe(15)
      expect(parseInteger('3.14')).toBe(3)
      expect(parseInteger('9.8')).toBe(10)
      expect(parseInteger('-7')).toBe(-7)
    })

    it('rounds parsed fraction strings', () => {
      expect(parseInteger('1/2')).toBe(1)
      expect(parseInteger('1/4')).toBe(0)
      expect(parseInteger('3/4')).toBe(1)
    })

    it('returns fallback for invalid strings', () => {
      expect(parseInteger('abc')).toBe(0)
      expect(parseInteger('')).toBe(0)
      expect(parseInteger('   ')).toBe(0)
      expect(parseInteger('abc', 99)).toBe(99)
    })

    it('returns fallback for null and undefined', () => {
      expect(parseInteger(null)).toBe(0)
      expect(parseInteger(undefined)).toBe(0)
      expect(parseInteger(null, 42)).toBe(42)
    })

    it('returns fallback for non-finite numbers', () => {
      expect(parseInteger(Number.NaN)).toBe(0)
      expect(parseInteger(Infinity)).toBe(0)
      expect(parseInteger(-Infinity, 3)).toBe(3)
    })
  })

  describe('toIntegerOrUndefined', () => {
    it('returns undefined for null and undefined', () => {
      expect(toIntegerOrUndefined(null)).toBeUndefined()
      expect(toIntegerOrUndefined(undefined)).toBeUndefined()
    })

    it('returns integer numbers as-is', () => {
      expect(toIntegerOrUndefined(15)).toBe(15)
      expect(toIntegerOrUndefined(0)).toBe(0)
      expect(toIntegerOrUndefined(-3)).toBe(-3)
    })

    it('rounds float numbers to the nearest integer', () => {
      expect(toIntegerOrUndefined(15.6)).toBe(16)
      expect(toIntegerOrUndefined(15.2)).toBe(15)
    })

    it('parses and rounds numeric strings', () => {
      expect(toIntegerOrUndefined('20')).toBe(20)
      expect(toIntegerOrUndefined('3.7')).toBe(4)
      expect(toIntegerOrUndefined('1/2')).toBe(1)
    })

    it('returns undefined for empty or invalid strings', () => {
      expect(toIntegerOrUndefined('')).toBeUndefined()
      expect(toIntegerOrUndefined('   ')).toBeUndefined()
      expect(toIntegerOrUndefined('abc')).toBeUndefined()
    })

    it('returns undefined for non-finite numbers', () => {
      expect(toIntegerOrUndefined(Number.NaN)).toBeUndefined()
      expect(toIntegerOrUndefined(Infinity)).toBeUndefined()
    })
  })

  describe('parseIntegerFromText', () => {
    it('returns truncated numeric values', () => {
      expect(parseIntegerFromText(5)).toBe(5)
      expect(parseIntegerFromText(5.9)).toBe(5)
      expect(parseIntegerFromText(-3.7)).toBe(-3)
    })

    it('extracts first integer from a string', () => {
      expect(parseIntegerFromText('reach 10 ft.')).toBe(10)
      expect(parseIntegerFromText('DC 15')).toBe(15)
      expect(parseIntegerFromText('120 ft.')).toBe(120)
    })

    it('extracts negative integers', () => {
      expect(parseIntegerFromText('-5 modifier')).toBe(-5)
    })

    it('returns fallback when no integer found', () => {
      expect(parseIntegerFromText('no numbers here')).toBe(0)
      expect(parseIntegerFromText('no numbers here', 99)).toBe(99)
    })

    it('returns fallback for null and undefined', () => {
      expect(parseIntegerFromText(null)).toBe(0)
      expect(parseIntegerFromText(undefined)).toBe(0)
    })

    it('returns fallback for non-finite numbers', () => {
      expect(parseIntegerFromText(Number.NaN)).toBe(0)
      expect(parseIntegerFromText(Infinity)).toBe(0)
    })
  })

  describe('parseBoolean', () => {
    it('passes through boolean values', () => {
      expect(parseBoolean(true)).toBeTruthy()
      expect(parseBoolean(false)).toBeFalsy()
    })

    it('converts number 1 to true, other numbers to false', () => {
      expect(parseBoolean(1)).toBeTruthy()
      expect(parseBoolean(0)).toBeFalsy()
      expect(parseBoolean(2)).toBeFalsy()
    })

    it('converts truthy strings to true', () => {
      expect(parseBoolean('1')).toBeTruthy()
      expect(parseBoolean('true')).toBeTruthy()
      expect(parseBoolean('TRUE')).toBeTruthy()
      expect(parseBoolean('yes')).toBeTruthy()
      expect(parseBoolean('required')).toBeTruthy()
    })

    it('converts other strings to false', () => {
      expect(parseBoolean('false')).toBeFalsy()
      expect(parseBoolean('no')).toBeFalsy()
      expect(parseBoolean('0')).toBeFalsy()
      expect(parseBoolean('')).toBeFalsy()
    })

    it('returns false for null and undefined', () => {
      expect(parseBoolean(null)).toBeFalsy()
      expect(parseBoolean(undefined)).toBeFalsy()
    })
  })

  describe('formatChallengeRating', () => {
    it('formats fractions', () => {
      expect(formatChallengeRating(0.125)).toBe('1/8')
      expect(formatChallengeRating(0.25)).toBe('1/4')
      expect(formatChallengeRating(0.5)).toBe('1/2')
    })

    it('formats integers as strings', () => {
      expect(formatChallengeRating(0)).toBe('0')
      expect(formatChallengeRating(1)).toBe('1')
      expect(formatChallengeRating(11)).toBe('11')
      expect(formatChallengeRating(30)).toBe('30')
    })
  })
})
