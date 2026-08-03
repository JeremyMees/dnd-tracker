import { describe, expect, it } from 'vitest'

describe('locale', () => {
  describe('localeParam', () => {
    it('returns an empty string for the default locale', () => {
      expect(localeParam('en')).toBe('')
    })

    it('returns a prefixed segment for non-default locales', () => {
      expect(localeParam('nl')).toBe('/nl')
    })

    it('prefixes any unknown locale', () => {
      expect(localeParam('fr')).toBe('/fr')
      expect(localeParam('de-DE')).toBe('/de-DE')
    })

    it('returns an empty string only for an exact match', () => {
      expect(localeParam('EN')).toBe('/EN')
      expect(localeParam('en-US')).toBe('/en-US')
      expect(localeParam('')).toBe('/')
    })
  })

  describe('localized', () => {
    it('leaves the default locale path unprefixed', () => {
      expect(localized({ '/contact': { prerender: true } })).toEqual({
        '/contact': { prerender: true },
        '/nl/contact': { prerender: true },
      })
    })

    it('does not append a trailing slash to the home page', () => {
      expect(Object.keys(localized({ '/': { prerender: true } }))).toEqual([
        '/',
        '/nl',
      ])
    })

    it('keeps wildcards at the end of the path', () => {
      expect(
        Object.keys(localized({ '/policies/**': { robots: false } })),
      ).toEqual(['/policies/**', '/nl/policies/**'])
    })

    it('generates a path per locale for every rule', () => {
      const rules = localized({
        '/': { prerender: true },
        '/no-access': { robots: false },
      })

      expect(Object.keys(rules)).toHaveLength(2 * locales.length)
      expect(rules['/nl/no-access']).toEqual({ robots: false })
    })

    it('shares the rule object between locales', () => {
      const rule = { prerender: true }
      const rules = localized({ '/contact': rule })

      expect(rules['/contact']).toBe(rules['/nl/contact'])
    })

    it('returns an empty object for no rules', () => {
      expect(localized({})).toEqual({})
    })
  })
})
