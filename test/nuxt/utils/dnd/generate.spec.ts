import { describe, expect, it } from 'vitest'

describe('dnd/generate', () => {
  describe('generateSpeedEntries', () => {
    it('should only include walk when no optional speeds are set', () => {
      const result = generateSpeedEntries({ unit: 'feet', walk: 30 })

      expect(result).toEqual([{ label: 'Walk', val: '30 feet' }])
    })

    it('should include all provided speed types', () => {
      const result = generateSpeedEntries({ unit: 'feet', walk: 30, fly: 60, swim: 20, burrow: 10, climb: 15, crawl: 5 })

      expect(result).toHaveLength(6)
      expect(result).toContainEqual({ label: 'Walk', val: '30 feet' })
      expect(result).toContainEqual({ label: 'Fly', val: '60 feet' })
      expect(result).toContainEqual({ label: 'Swim', val: '20 feet' })
      expect(result).toContainEqual({ label: 'Burrow', val: '10 feet' })
      expect(result).toContainEqual({ label: 'Climb', val: '15 feet' })
      expect(result).toContainEqual({ label: 'Crawl', val: '5 feet' })
    })

    it('should omit undefined optional speeds', () => {
      const result = generateSpeedEntries({ unit: 'feet', walk: 30, fly: undefined })

      expect(result).toHaveLength(1)
      expect(result).not.toContainEqual(expect.objectContaining({ label: 'Fly' }))
    })

    it('should use the speed unit in the value', () => {
      const result = generateSpeedEntries({ unit: 'miles', walk: 9 })

      expect(result[0]?.val).toBe('9 miles')
    })
  })

  describe('generateSightEntries', () => {
    it('should include normalSightRange when set', () => {
      const result = generateSightEntries({ normalSightRange: 60 })

      expect(result).toEqual([{ label: 'Normal Sight', val: '60 ft' }])
    })

    it('should include all provided sight types', () => {
      const result = generateSightEntries({ normalSightRange: 60, darkVisionRange: 120, blindSightRange: 30, tremorSenseRange: 10, trueSightRange: 60 })

      expect(result).toHaveLength(5)
      expect(result).toContainEqual({ label: 'Normal Sight', val: '60 ft' })
      expect(result).toContainEqual({ label: 'Darkvision', val: '120 ft' })
      expect(result).toContainEqual({ label: 'Blindsight', val: '30 ft' })
      expect(result).toContainEqual({ label: 'Tremorsense', val: '10 ft' })
      expect(result).toContainEqual({ label: 'Truesight', val: '60 ft' })
    })

    it('should omit undefined optional sight ranges', () => {
      const result = generateSightEntries({ normalSightRange: 60, darkVisionRange: undefined })

      expect(result).toHaveLength(1)
      expect(result).not.toContainEqual(expect.objectContaining({ label: 'Darkvision' }))
    })

    it('should always use ft as the unit', () => {
      const result = generateSightEntries({ normalSightRange: 30 })

      expect(result[0]?.val).toBe('30 ft')
    })
  })

  describe('generateSkillEntries', () => {
    it('should map each skill key to its label and value', () => {
      const result = generateSkillEntries({ acrobatics: 3, stealth: -1 } as any)

      expect(result).toContainEqual({ key: 'acrobatics', label: 'Acrobatics', val: 3 })
      expect(result).toContainEqual({ key: 'stealth', label: 'Stealth', val: -1 })
    })

    it('should return one entry per key', () => {
      const bonuses = { acrobatics: 0, sleightOfHand: 2 } as any
      const result = generateSkillEntries(bonuses)

      expect(result).toHaveLength(2)
    })

    it('should return an empty array for empty skill bonuses', () => {
      expect(generateSkillEntries({} as any)).toEqual([])
    })
  })
})
