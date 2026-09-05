import { describe, expect, it } from 'vitest'
import {
  open5eV2SpellFixture,
  open5eV1SpellFixture,
} from '~~/test/fixtures/open5e'

describe('transformers/spell', () => {
  describe('toSpell (V2)', () => {
    it('maps core fields', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.id).toBe('srd-2024_acid-arrow')
      expect(spell.name).toBe('Acid Arrow')
      expect(spell.level).toBe(2)
      expect(spell.school).toBe('evocation')
      expect(spell.classes).toContain('wizard')
      expect(spell.ritual).toBeFalsy()
      expect(spell.concentration).toBeFalsy()
    })

    it('maps range and unit', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.range).toBe(90)
      expect(spell.rangeUnit).toBe('feet')
      expect(spell.rangeText).toBe('90 feet')
    })

    it('maps components', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.verbal).toBeTruthy()
      expect(spell.somatic).toBeTruthy()
      expect(spell.material).toBeTruthy()
      expect(spell.materialSpecified).toBe('powdered rhubarb leaf')
    })

    it('maps damage types', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.damageTypes).toContain('acid')
    })

    it('maps casting options', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.castingOptions.length).toBeGreaterThan(0)
      expect(spell.castingOptions[0]!.type).toBe('slot_level_3')
    })

    it('omits casting option fields the api left null', () => {
      const spell = toSpell(open5eV2SpellFixture)
      const [option] = spell.castingOptions

      expect(option!.damageRoll).toBe('5d4')
      expect(option!.targetCount).toBeUndefined()
      expect(option!.duration).toBeUndefined()
      expect(option!.range).toBeUndefined()
      expect(option!.concentration).toBeUndefined()
      expect(option!.shapeSize).toBeUndefined()
      expect(option!.desc).toBeUndefined()
    })

    it('maps every casting option field when the api provides them', () => {
      const spell = toSpell({
        ...open5eV2SpellFixture,
        casting_options: [
          {
            type: 'slot_level_3',
            damage_roll: '5d4',
            target_count: 2,
            duration: '1 minute',
            range: '120 feet',
            concentration: true,
            shape_size: 20,
            desc: 'A wider spray of acid.',
          },
        ],
      })

      expect(spell.castingOptions[0]).toEqual({
        type: 'slot_level_3',
        damageRoll: '5d4',
        targetCount: 2,
        duration: '1 minute',
        range: '120 feet',
        concentration: true,
        shapeSize: 20,
        desc: 'A wider spray of acid.',
      })
    })

    it('omits an empty damage roll on a casting option', () => {
      const spell = toSpell({
        ...open5eV2SpellFixture,
        casting_options: [
          {
            type: 'slot_level_3',
            damage_roll: null,
            target_count: null,
            duration: null,
            range: null,
            concentration: null,
            shape_size: null,
            desc: null,
          },
        ],
      })

      expect(spell.castingOptions[0]!.damageRoll).toBeUndefined()
    })

    it('maps the optional top level fields when present', () => {
      const spell = toSpell({
        ...open5eV2SpellFixture,
        reaction_condition: 'when you are hit by an attack',
        material_cost: 50,
        shape_type: 'cone',
        shape_size: 15,
      })

      expect(spell.reactionCondition).toBe('when you are hit by an attack')
      expect(spell.materialCost).toBe(50)
      expect(spell.shapeType).toBe('cone')
      expect(spell.shapeSize).toBe(15)
    })

    it('omits the optional top level fields when the api returns null', () => {
      const spell = toSpell(open5eV2SpellFixture)

      expect(spell.reactionCondition).toBeUndefined()
      expect(spell.materialCost).toBeUndefined()
      expect(spell.shapeType).toBeUndefined()
      expect(spell.shapeSize).toBeUndefined()
    })
  })

  describe('toSpell (V1)', () => {
    it('maps core fields using slug as id', () => {
      const spell = toSpell(open5eV1SpellFixture)

      expect(spell.id).toBe('acid-arrow')
      expect(spell.name).toBe('Acid Arrow')
      expect(spell.level).toBe(2)
      expect(spell.school).toBe('evocation')
      expect(spell.classes).toContain('wizard')
      expect(spell.ritual).toBeFalsy()
      expect(spell.concentration).toBeFalsy()
    })

    it('returns empty castingOptions array', () => {
      const spell = toSpell(open5eV1SpellFixture)

      expect(spell.castingOptions).toEqual([])
    })

    it('maps range and unit from string', () => {
      const spell = toSpell(open5eV1SpellFixture)

      expect(spell.range).toBe(90)
      expect(spell.rangeUnit).toBe('feet')
      expect(spell.rangeText).toBe('90 feet')
    })

    it('parses components from string', () => {
      const spell = toSpell(open5eV1SpellFixture)

      expect(spell.verbal).toBeTruthy()
      expect(spell.somatic).toBeTruthy()
      expect(spell.material).toBeTruthy()
      expect(spell.materialSpecified).toBe('powdered rhubarb leaf')
    })

    it('falls back to empty strings for absent text fields', () => {
      const spell = toSpell({
        ...open5eV1SpellFixture,
        range: undefined,
        casting_time: undefined,
        material: undefined,
        duration: undefined,
        higher_level: undefined,
      })

      expect(spell.rangeText).toBe('')
      expect(spell.castingTime).toBe('')
      expect(spell.materialSpecified).toBe('')
      expect(spell.duration).toBe('')
      expect(spell.higherLevel).toBe('')
    })
  })
})
