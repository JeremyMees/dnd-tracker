import { describe, expect, it } from 'vitest'
import {
  open5eV2ArmorFixture,
  open5eV1ArmorFixture,
} from '~~/test/fixtures/open5e'

describe('transformers/armor', () => {
  describe('toArmor (V2)', () => {
    it('maps core fields', () => {
      const armor = toArmor(open5eV2ArmorFixture)

      expect(armor.id).toBe('srd-2024_breastplate')
      expect(armor.name).toBe('Breastplate')
      expect(armor.type).toBe('medium')
      expect(armor.acBase).toBe(14)
      expect(armor.acDisplay).toBe('14 + Dex modifier (max 2)')
      expect(armor.acAddDexMod).toBeTruthy()
      expect(armor.acCapDexMod).toBe(2)
      expect(armor.grantsStealthDisadvantage).toBeFalsy()
    })

    it('omits strengthScoreRequired when null', () => {
      const armor = toArmor(open5eV2ArmorFixture)

      expect(armor.strengthScoreRequired).toBeUndefined()
    })

    it('maps strengthScoreRequired when present', () => {
      const armor = toArmor({
        ...open5eV2ArmorFixture,
        strength_score_required: 15,
      })

      expect(armor.strengthScoreRequired).toBe(15)
    })

    it('omits acCapDexMod when null', () => {
      const armor = toArmor({ ...open5eV2ArmorFixture, ac_cap_dexmod: null })

      expect(armor.acCapDexMod).toBeUndefined()
    })
  })

  describe('toArmor (V1)', () => {
    it('maps core fields using slug as id', () => {
      const armor = toArmor(open5eV1ArmorFixture)

      expect(armor.id).toBe('chain-mail')
      expect(armor.name).toBe('Chain Mail')
      expect(armor.acBase).toBe(16)
    })

    it('maps armor type from category string', () => {
      const armor = toArmor(open5eV1ArmorFixture)

      expect(armor.type).toBe('heavy')
      expect(armor.acAddDexMod).toBeFalsy()
    })

    it('parses stealth disadvantage from string', () => {
      const armor = toArmor(open5eV1ArmorFixture)

      expect(armor.grantsStealthDisadvantage).toBeTruthy()
    })

    it('parses strength score required from text', () => {
      const armor = toArmor(open5eV1ArmorFixture)

      expect(armor.strengthScoreRequired).toBe(13)
    })

    it('omits strengthScoreRequired when there is no requirement', () => {
      const armor = toArmor({
        ...open5eV1ArmorFixture,
        strength_requirement: '',
      })

      expect(armor.strengthScoreRequired).toBeUndefined()
    })

    it('caps the dex modifier at 2 for medium armor', () => {
      const armor = toArmor({
        ...open5eV1ArmorFixture,
        category: 'Medium Armor',
      })

      expect(armor.type).toBe('medium')
      expect(armor.acAddDexMod).toBeTruthy()
      expect(armor.acCapDexMod).toBe(2)
    })

    it('prefers ac_string over the numeric armor class for the display', () => {
      const armor = toArmor({
        ...open5eV1ArmorFixture,
        ac_string: '16 (chain mail)',
      })

      expect(armor.acDisplay).toBe('16 (chain mail)')
    })
  })
})
