import { describe, expect, it } from 'vitest'
import { conditionSchema, deathSavesSchema } from '~~/shared/utils/dnd/schema'

describe('dnd/schema', () => {
  describe('deathSavesSchema', () => {
    it('accepts a valid death saves object', () => {
      expect(() =>
        deathSavesSchema.parse({
          save: [true, false, false],
          fail: [false, false, false],
        }),
      ).not.toThrow()
    })

    it('rejects a tuple with the wrong length', () => {
      expect(() =>
        deathSavesSchema.parse({
          save: [true, false],
          fail: [false, false, false],
        }),
      ).toThrow()
    })

    it('rejects a tuple with non-boolean values', () => {
      expect(() =>
        deathSavesSchema.parse({
          save: [true, false, 'yes'],
          fail: [false, false, false],
        }),
      ).toThrow()
    })

    it('rejects a missing fail array', () => {
      expect(() =>
        deathSavesSchema.parse({ save: [true, false, false] }),
      ).toThrow()
    })
  })

  describe('conditionSchema', () => {
    it('accepts a minimal condition', () => {
      expect(() =>
        conditionSchema.parse({
          id: 'blinded',
          name: 'Blinded',
          desc: 'Cannot see.',
        }),
      ).not.toThrow()
    })

    it('accepts a condition with level and hasLevels', () => {
      expect(() =>
        conditionSchema.parse({
          id: 'exhaustion',
          name: 'Exhaustion',
          desc: 'Levels of exhaustion.',
          level: 2,
          hasLevels: true,
        }),
      ).not.toThrow()
    })

    it('rejects a missing desc', () => {
      expect(() =>
        conditionSchema.parse({ id: 'blinded', name: 'Blinded' }),
      ).toThrow()
    })

    it('rejects an empty id', () => {
      expect(() =>
        conditionSchema.parse({ id: '', name: 'Blinded', desc: 'Cannot see.' }),
      ).toThrow()
    })

    it('rejects an empty name', () => {
      expect(() =>
        conditionSchema.parse({ id: 'blinded', name: '', desc: 'Cannot see.' }),
      ).toThrow()
    })
  })
})
