import { beforeEach, describe, expect, it, vi } from 'vitest'
import { randomName, randomNames } from '~~/server/utils/names'

describe('server/utils/names', () => {
  beforeEach(() => vi.restoreAllMocks())

  describe('randomName', () => {
    it('should generate a name with first and last name', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const name = randomName()

      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('should include a middle name when probability is met', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05)

      const name = randomName()

      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('should generate race and gender specific names', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      expect(randomName('elf', 'female')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
      expect(randomName('dragonborn', 'male')).toMatch(
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,
      )
      expect(randomName('human', 'nonbinary')).toMatch(
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,
      )
    })

    it('should return Unknown when race data cannot be resolved', () => {
      const name = randomName('unknown-race' as DndRace, 'male')
      expect(name).toBe('Unknown')
    })
  })

  describe('randomNames', () => {
    it('should generate the requested amount of names', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const names = randomNames(5)

      expect(names.length).toBe(5)
      names.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/))
    })

    it('should pass the race and gender through to every name', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const names = randomNames(3, 'dwarf', 'male')

      expect(names).toEqual([names[0], names[0], names[0]])
    })

    it('should return an empty list for an amount of zero', () => {
      expect(randomNames(0)).toEqual([])
    })
  })
})
