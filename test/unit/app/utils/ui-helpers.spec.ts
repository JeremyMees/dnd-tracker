import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createApp } from 'vue'
import type { InjectionKey } from 'vue'
import {
  sortByNumber,
  sortByString,
  sortCreatedAt,
  randomString,
  randomColor,
  homebrewIcon,
  homebrewBgColor,
  homebrewColor,
  isDefined,
  validateParamId,
  animateTableUpdate,
  kebabToCamel,
  timeRemaining,
  scrollToId,
  formatDate,
  validateInject,
} from '~/utils/ui-helpers'

beforeEach(() => {
  global.document = {
    getElementById: vi.fn(),
  } as unknown as Document
})

vi.mock('#app', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createError: (error: string | { message?: string; details?: string }) => {
    throw new Error(
      typeof error === 'string'
        ? error
        : error.message || error.details || 'Unknown error',
    )
  },
}))

describe('ui-helpers', () => {
  describe('sortByNumber', () => {
    it('should sort numbers in ascending order', () => {
      expect(sortByNumber(5, 10, true)).toBeLessThan(0)
    })

    it('should sort numbers in descending order', () => {
      expect(sortByNumber(10, 5, false)).toBeLessThan(0)
    })

    it('should handle arrays by comparing their lengths', () => {
      expect(sortByNumber([1, 2, 3], [1], true)).toBeGreaterThan(0)
    })

    it('should handle null values', () => {
      expect(sortByNumber(null, 5, true)).toBeGreaterThan(0)
      expect(sortByNumber(5, null, true)).toBeLessThan(0)
      expect(sortByNumber(null, null, true)).toBe(0)
    })

    it('should sort non-numeric values last rather than producing NaN', () => {
      expect(sortByNumber('abc', 5, true)).toBeGreaterThan(0)
      expect(sortByNumber(5, {}, true)).toBeLessThan(0)
      expect(sortByNumber(true, undefined, true)).toBe(0)
    })
  })

  describe('sortByString', () => {
    it('should sort strings in ascending order', () => {
      expect(sortByString('a', 'b', true)).toBeLessThan(0)
    })

    it('should sort strings in descending order', () => {
      expect(sortByString('b', 'a', false)).toBeLessThan(0)
    })

    it('should handle null or undefined values', () => {
      expect(sortByString(null, 'test', true)).toBeLessThan(0)
      expect(sortByString('test', undefined, true)).toBeGreaterThan(0)
    })

    it('should treat non-string values as empty instead of throwing', () => {
      expect(() => sortByString(5, 'test', true)).not.toThrow()
      expect(sortByString(5, 'test', true)).toBeLessThan(0)
      expect(sortByString('test', {}, true)).toBeGreaterThan(0)
    })
  })

  describe('sortCreatedAt', () => {
    it('should sort objects by createdAt date in descending order', () => {
      const items = [
        { id: 1, createdAt: '2023-01-01' },
        { id: 2, createdAt: '2023-02-01' },
        { id: 3, createdAt: '2023-01-15' },
      ]
      const sorted = sortCreatedAt(items)

      expect(sorted[0]?.id).toBe(2)
      expect(sorted[1]?.id).toBe(3)
      expect(sorted[2]?.id).toBe(1)
    })
  })

  describe('randomString', () => {
    it('should return a string', () => {
      const result = randomString()

      expect(typeof result).toBe('string')
    })

    it('should return different values on successive calls', () => {
      const result1 = randomString()
      const result2 = randomString()

      expect(result1).not.toBe(result2)
    })
  })

  describe('randomColor', () => {
    it('should return a hex color string', () => {
      const result = randomColor()

      expect(typeof result).toBe('string')
      expect(result.length).toBeLessThanOrEqual(6)
    })
  })

  describe('homebrewIcon', () => {
    it('should return correct icons for each type', () => {
      expect(homebrewIcon('summon')).toBe('tabler:wand')
      expect(homebrewIcon('npc')).toBe('tabler:user')
      expect(homebrewIcon('monster')).toBe('tabler:bat')
      expect(homebrewIcon('lair')).toBe('tabler:building-castle')
      expect(homebrewIcon('default' as unknown as HomebrewType)).toBe(
        'tabler:sword',
      )
    })
  })

  describe('homebrewBgColor', () => {
    it('should return correct background colors for each type', () => {
      expect(homebrewBgColor('summon')).toBe('bg-tertiary')
      expect(homebrewBgColor('npc')).toBe('bg-success')
      expect(homebrewBgColor('monster')).toBe('bg-destructive')
      expect(homebrewBgColor('lair')).toBe('bg-warning')
      expect(homebrewBgColor('default' as unknown as HomebrewType)).toBe(
        'bg-primary',
      )
    })
  })

  describe('homebrewColor', () => {
    it('should return correct text colors for each type', () => {
      expect(homebrewColor('summon')).toBe('text-tertiary')
      expect(homebrewColor('npc')).toBe('text-success')
      expect(homebrewColor('monster')).toBe('text-destructive')
      expect(homebrewColor('lair')).toBe('text-warning')
      expect(homebrewColor('default' as unknown as HomebrewType)).toBe(
        'text-primary',
      )
    })
  })

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBeTruthy()
      expect(isDefined('')).toBeTruthy()
      expect(isDefined(false)).toBeTruthy()
      expect(isDefined({})).toBeTruthy()
    })

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBeFalsy()
      expect(isDefined(undefined)).toBeFalsy()
    })
  })

  describe('validateParamId', () => {
    it('should convert valid string id to number', () => {
      expect(validateParamId('123')).toBe(123)
    })

    it('should throw error for undefined id', () => {
      expect(() => validateParamId(undefined)).toThrow()
    })

    it('should throw error for array id', () => {
      expect(() => validateParamId(['123'])).toThrow()
    })

    it('should throw error for non-numeric id', () => {
      expect(() => validateParamId('abc')).toThrow()
    })
  })

  describe('animateTableUpdate', () => {
    it('applies and clears table update animation', () => {
      vi.useFakeTimers()

      const el = { style: {} as CSSStyleDeclaration, offsetHeight: 0 }
      document.getElementById = vi.fn().mockReturnValue(el)

      animateTableUpdate('row-1', 'green')

      expect(document.getElementById).toHaveBeenCalledWith('row-1')
      expect(el.style.animation).toBe('pulse-green 1s ease-in-out')

      vi.advanceTimersByTime(1000)
      expect(el.style.animation).toBe('')

      vi.useRealTimers()
    })

    it('returns early when element is not found', () => {
      vi.useFakeTimers()
      document.getElementById = vi.fn().mockReturnValue(null)

      expect(() => animateTableUpdate('missing', 'green')).not.toThrow()
      expect(document.getElementById).toHaveBeenCalledWith('missing')

      vi.runAllTimers()
      vi.useRealTimers()
    })
  })

  describe('kebabToCamel', () => {
    it('converts a kebab-case string to camelCase', () => {
      expect(kebabToCamel('pro-required')).toBe('proRequired')
      expect(kebabToCamel('no-active-session')).toBe('noActiveSession')
    })

    it('returns a string without dashes unchanged', () => {
      expect(kebabToCamel('generic')).toBe('generic')
    })

    it('returns an empty string unchanged', () => {
      expect(kebabToCamel('')).toBe('')
    })
  })

  describe('scrollToId', () => {
    it('scrolls the matching element into view', () => {
      const scrollIntoView = vi.fn()
      document.getElementById = vi.fn().mockReturnValue({ scrollIntoView })

      scrollToId('some-id')

      expect(document.getElementById).toHaveBeenCalledWith('some-id')
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
      })
    })

    it('does nothing when no element matches the id', () => {
      document.getElementById = vi.fn().mockReturnValue(null)

      expect(() => scrollToId('missing')).not.toThrow()
    })
  })

  describe('formatDate', () => {
    it('formats a date using the current locale', () => {
      expect(formatDate('2024-03-05')).toBe('03/05/24')
      expect(formatDate(new Date('2024-12-25'))).toBe('12/25/24')
    })
  })

  describe('validateInject', () => {
    it('throws when the key was never provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const key = Symbol('missing') as InjectionKey<string>

      expect(() => validateInject(key)).toThrow()

      warn.mockRestore()
    })

    it('returns the provided value for the key', () => {
      const key = Symbol('provided') as InjectionKey<string>
      const app = createApp({})
      app.provide(key, 'the value')

      const result = app.runWithContext(() => validateInject(key))

      expect(result).toBe('the value')
    })
  })

  describe('timeRemaining', () => {
    it('formats hours and minutes when more than an hour remains', () => {
      const now = new Date('2024-01-01T00:00:00.000Z').getTime()
      const expiresAt = new Date('2024-01-01T02:15:00.000Z')

      expect(timeRemaining(expiresAt, now)).toBe('2h 15m')
    })

    it('formats only minutes when less than an hour remains', () => {
      const now = new Date('2024-01-01T00:00:00.000Z').getTime()
      const expiresAt = new Date('2024-01-01T00:42:00.000Z')

      expect(timeRemaining(expiresAt, now)).toBe('42m')
    })

    it('accepts an ISO string for expiresAt', () => {
      const now = new Date('2024-01-01T00:00:00.000Z').getTime()

      expect(timeRemaining('2024-01-01T00:10:00.000Z', now)).toBe('10m')
    })

    it('returns an empty string when the time has already expired', () => {
      const now = new Date('2024-01-01T00:10:00.000Z').getTime()
      const expiresAt = new Date('2024-01-01T00:00:00.000Z')

      expect(timeRemaining(expiresAt, now)).toBe('')
    })

    it('returns an empty string when expiring exactly now', () => {
      const now = new Date('2024-01-01T00:00:00.000Z').getTime()

      expect(timeRemaining(new Date(now), now)).toBe('')
    })
  })
})
