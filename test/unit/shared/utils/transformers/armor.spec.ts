import { describe, expect, it } from 'vitest'
import { open5eV2ArmorFixture } from '~~/test/fixtures/open5e'

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
})
