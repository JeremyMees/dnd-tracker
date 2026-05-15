import { describe, expect, it } from 'vitest'
import { open5eV2SpellFixture, open5eV1SpellFixture } from '~~/test/nuxt/fixtures/open5e'

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
  })
})
