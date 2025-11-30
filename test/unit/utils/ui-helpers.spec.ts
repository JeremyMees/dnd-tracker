import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
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
  sanitizeHTML,
  animateTableUpdate,
} from '~/utils/ui-helpers'

beforeEach(() => {
  global.document = {
    getElementById: vi.fn(),
  } as any
})

mockNuxtImport('createError', () => (error: any) => {
  throw new Error(
    typeof error === 'string'
      ? error
      : error.message || error.details || 'Unknown error',
  )
})

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
      expect(sortByNumber(null as any, 5, true)).toBeGreaterThan(0)
      expect(sortByNumber(5, null as any, true)).toBeLessThan(0)
      expect(sortByNumber(null as any, null as any, true)).toBe(0)
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
      expect(sortByString(null as any, 'test', true)).toBeLessThan(0)
      expect(sortByString('test', undefined as any, true)).toBeGreaterThan(0)
    })
  })

  describe('sortCreatedAt', () => {
    it('should sort objects by created_at date in descending order', () => {
      const items = [
        { id: 1, created_at: '2023-01-01' },
        { id: 2, created_at: '2023-02-01' },
        { id: 3, created_at: '2023-01-15' },
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
      expect(homebrewIcon('default' as any)).toBe('tabler:sword')
    })
  })

  describe('homebrewBgColor', () => {
    it('should return correct background colors for each type', () => {
      expect(homebrewBgColor('summon')).toBe('bg-tertiary')
      expect(homebrewBgColor('npc')).toBe('bg-success')
      expect(homebrewBgColor('monster')).toBe('bg-destructive')
      expect(homebrewBgColor('lair')).toBe('bg-warning')
      expect(homebrewBgColor('default' as any)).toBe('bg-primary')
    })
  })

  describe('homebrewColor', () => {
    it('should return correct text colors for each type', () => {
      expect(homebrewColor('summon')).toBe('text-tertiary')
      expect(homebrewColor('npc')).toBe('text-success')
      expect(homebrewColor('monster')).toBe('text-destructive')
      expect(homebrewColor('lair')).toBe('text-warning')
      expect(homebrewColor('default' as any)).toBe('text-primary')
    })
  })

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined({})).toBe(true)
    })

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBe(false)
      expect(isDefined(undefined)).toBe(false)
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

  describe('sanitizeHTML', () => {
    it('should sanitize HTML by removing disallowed tags', () => {
      const dirtyHtml = `
        <script>alert("xss")</script>
        <img src="https://example.com/image.jpg" alt="Image">
        <iframe src="https://example.com/iframe"></iframe>
        <video src="https://example.com/video.mp4"></video>
        <audio src="https://example.com/audio.mp3"></audio>
        <object data="https://example.com/object.pdf"></object>
      `
      const result = sanitizeHTML(dirtyHtml)

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<img>')
      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('<video>')
      expect(result).not.toContain('<audio>')
      expect(result).not.toContain('<object>')
    })

    it('Should allow all allowed tags and attributes', () => {
      const dirtyHtml = `
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <h3>Subsubtitle</h3>
        <p>Paragraph</p>
        <a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">Link</a>
        <ul><li>Item 1</li></ul>
        <ol><li>Item 1</li></ol>
        <blockquote>Quote</blockquote>
        <mark>Highlight</mark>
        <strong>Bold</strong>
        <em>Italic</em>
        <s>Strikethrough</s>
      `
      const result = sanitizeHTML(dirtyHtml)

      expect(result).toContain('<h1>')
      expect(result).toContain('<h2>')
      expect(result).toContain('<h3>')
      expect(result).toContain('<p>')
      expect(result).toContain('<a href="https://example.com" name="link" target="_blank" rel="noopener noreferrer">')
      expect(result).toContain('<ul>')
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('<mark>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<s>')
    })

    it('should replace <hr /> with <hr>', () => {
      const html = '<p>Text</p><hr /><p>More text</p>'
      const result = sanitizeHTML(html)

      expect(result).toContain('<hr>')
      expect(result).not.toContain('<hr />')
    })
  })

  describe('animateTableUpdate', () => {
    it('applies and clears table update animation', () => {
      vi.useFakeTimers()

      const el: any = { style: {}, offsetHeight: 0 }
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
})
