import { describe, expect, it } from 'vitest'
import {
  open5eV2MagicItemFixture,
  open5eV2WeaponFixture,
} from '~~/test/fixtures/open5e'

describe('transformers/magic-item', () => {
  describe('toMagicItem (V2)', () => {
    it('maps core fields', () => {
      const item = toMagicItem(open5eV2MagicItemFixture)

      expect(item.id).toBe('srd-2024_adamantine-armor-breastplate')
      expect(item.name).toBe('Adamantine Armor (Breastplate)')
      expect(item.isMagicItem).toBeTruthy()
      expect(item.requiresAttunement).toBeFalsy()
    })

    it('marks v2 items as magic without an is_magic_item field', () => {
      expect('is_magic_item' in open5eV2MagicItemFixture).toBe(false)
      expect(toMagicItem(open5eV2MagicItemFixture).isMagicItem).toBe(true)
    })

    it('maps rarity', () => {
      const item = toMagicItem(open5eV2MagicItemFixture)

      expect(item.rarity.name).toBe('Uncommon')
      expect(item.rarity.rank).toBe(2)
    })

    it('maps embedded armor', () => {
      const item = toMagicItem(open5eV2MagicItemFixture)

      expect(item.type).toBe('armor')
      expect(item.armor).toBeDefined()
      expect(item.armor!.acBase).toBe(14)
      expect(item.armor!.type).toBe('medium')
    })

    it('maps weight and cost', () => {
      const item = toMagicItem(open5eV2MagicItemFixture)

      expect(item.weight).toBe(20)
      expect(item.cost).toBe('0.00')
    })

    it('maps embedded weapon including property type and detail', () => {
      const item = toMagicItem({
        ...open5eV2MagicItemFixture,
        armor: null,
        weapon: open5eV2WeaponFixture,
      })

      expect(item.type).toBe('weapon')
      expect(item.armor).toBeUndefined()
      expect(item.weapon!.id).toBe('srd-2024_battleaxe')
      expect(item.weapon!.damageType).toBe('slashing')
      expect(item.weapon!.damageDice).toBe('1d8')
      expect(item.weapon!.distanceUnit).toBe('feet')
      expect(item.weapon!.isSimple).toBeFalsy()
      expect(item.weapon!.properties).toEqual([
        {
          property: {
            name: 'Topple',
            type: 'Mastery',
            desc: open5eV2WeaponFixture.properties[0]!.property.desc,
          },
        },
        {
          property: {
            name: 'Versatile',
            desc: open5eV2WeaponFixture.properties[1]!.property.desc,
          },
          detail: '1d10',
        },
      ])
    })

    it('maps armor optional fields when the api provides them', () => {
      const item = toMagicItem({
        ...open5eV2MagicItemFixture,
        armor: {
          ...open5eV2MagicItemFixture.armor!,
          strength_score_required: 13,
          ac_cap_dexmod: null,
        },
      })

      expect(item.armor!.strengthScoreRequired).toBe(13)
      expect(item.armor!.acCapDexMod).toBeUndefined()
    })

    it('maps attunement detail when attunement is required', () => {
      const item = toMagicItem({
        ...open5eV2MagicItemFixture,
        requires_attunement: true,
        attunement_detail: 'by a druid',
      })

      expect(item.requiresAttunement).toBeTruthy()
      expect(item.attunementDetail).toBe('by a druid')
    })

    it('derives the type from the category when there is no weapon or armor', () => {
      const item = toMagicItem({
        ...open5eV2MagicItemFixture,
        weapon: null,
        armor: null,
        category: { name: 'Potion', key: 'potion', url: '' },
      })

      expect(item.weapon).toBeUndefined()
      expect(item.armor).toBeUndefined()
      expect(item.type).toBe('potion')
    })
  })
})
