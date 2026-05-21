import { describe, expect, it } from 'vitest'

describe('dnd/languages', () => {
  describe('parseDndLanguages', () => {
    it('should return the name of each language', () => {
      const languages = [
        { name: 'Common', desc: 'The most common language' },
        { name: 'Elvish', desc: 'Spoken by elves' },
      ]

      expect(parseDndLanguages(languages)).toEqual(['Common', 'Elvish'])
    })

    it('should return an empty array for an empty input', () => {
      expect(parseDndLanguages([])).toEqual([])
    })

    it('should return a single name for a single language', () => {
      const languages = [{ name: 'Draconic', desc: 'Spoken by dragons' }]

      expect(parseDndLanguages(languages)).toEqual(['Draconic'])
    })

    it('should not include the desc field in the result', () => {
      const languages = [{ name: 'Dwarvish', desc: 'Spoken by dwarves' }]
      const result = parseDndLanguages(languages)

      expect(result).toEqual(['Dwarvish'])
      expect(result[0]).not.toContain('Spoken by dwarves')
    })
  })
})
