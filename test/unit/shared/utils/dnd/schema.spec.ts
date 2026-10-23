import { describe, expect, it } from 'vitest'
import {
  conditionSchema,
  deathSavesSchema,
  resourceUsesSchema,
  rowPatchSchema,
} from '~~/shared/utils/dnd/schema'

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

  describe('resourceUsesSchema', () => {
    it('accepts used legendary actions, resistances, reaction and actions', () => {
      const uses = {
        legendaryActions: 1,
        legendaryResistances: 2,
        reaction: true,
        actions: { 'Fire Breath': 1 },
      }

      expect(resourceUsesSchema.parse(uses)).toEqual(uses)
    })

    it('accepts an empty object', () => {
      expect(resourceUsesSchema.parse({})).toEqual({})
    })

    it('rejects unknown fields', () => {
      expect(resourceUsesSchema.safeParse({ spellSlots: 1 }).success).toBe(
        false,
      )
    })

    it('rejects negative and fractional uses', () => {
      expect(
        resourceUsesSchema.safeParse({ legendaryActions: -1 }).success,
      ).toBe(false)
      expect(
        resourceUsesSchema.safeParse({ actions: { Bite: 1.5 } }).success,
      ).toBe(false)
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

    it('accepts null level and hasLevels from the srd tables and drops them', () => {
      expect(
        conditionSchema.parse({
          id: 'blinded',
          name: 'Blinded',
          desc: 'Cannot see.',
          level: null,
          hasLevels: null,
        }),
      ).toStrictEqual({ id: 'blinded', name: 'Blinded', desc: '' })
    })

    describe('duration', () => {
      const prone = { id: 'prone', name: 'Prone', desc: 'On the ground.' }

      it('accepts rounds tied to a turn and drops a null save', () => {
        expect(
          conditionSchema.parse({
            ...prone,
            duration: { rowId: 'row-1', timing: 'end', rounds: 1, save: null },
          }),
        ).toStrictEqual({
          ...prone,
          desc: '',
          duration: { rowId: 'row-1', timing: 'end', rounds: 1 },
        })
      })

      it('accepts a save without rounds', () => {
        expect(
          conditionSchema.parse({
            ...prone,
            duration: {
              rowId: 'row-1',
              timing: 'end',
              save: { ability: 'wisdom', dc: 13 },
            },
          }).duration,
        ).toStrictEqual({
          rowId: 'row-1',
          timing: 'end',
          save: { ability: 'wisdom', dc: 13 },
        })
      })

      it('drops a null duration', () => {
        expect(
          conditionSchema.parse({ ...prone, duration: null }),
        ).toStrictEqual({ ...prone, desc: '' })
      })

      it('rejects a duration without rounds or a save', () => {
        expect(() =>
          conditionSchema.parse({
            ...prone,
            duration: { rowId: 'row-1', timing: 'end' },
          }),
        ).toThrow()
      })

      it.each([
        ['an unknown timing', { rowId: 'row-1', timing: 'later', rounds: 1 }],
        ['zero rounds', { rowId: 'row-1', timing: 'end', rounds: 0 }],
        ['an empty row id', { rowId: '', timing: 'end', rounds: 1 }],
        [
          'an unknown save ability',
          { rowId: 'row-1', timing: 'end', save: { ability: 'luck', dc: 10 } },
        ],
        [
          'a save dc above 30',
          {
            rowId: 'row-1',
            timing: 'end',
            save: { ability: 'wisdom', dc: 31 },
          },
        ],
      ])('rejects %s', (_, duration) => {
        expect(() => conditionSchema.parse({ ...prone, duration })).toThrow()
      })
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

  describe('rowPatchSchema', () => {
    it.each(['maxHitPointsOld', 'maxArmorClassOld'])(
      'keeps a cleared %s as null',
      field => {
        expect(rowPatchSchema.parse({ [field]: null })).toEqual({
          [field]: null,
        })
      },
    )

    it('rejects null for fields the row needs as a number', () => {
      expect(() => rowPatchSchema.parse({ hitPoints: null })).toThrow()
    })
  })
})
