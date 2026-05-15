import { describe, expect, it } from 'vitest'
import {
  open5eV2MagicItemFixture,
  open5eV1MagicItemFixture,
  open5eV1MagicItemWeaponFixture,
} from '~~/test/nuxt/fixtures/open5e'

describe('transformers/magic-item', () => {
  describe('toMagicItem (V2)', () => {
    it('maps core fields', () => {
      const item = toMagicItem(open5eV2MagicItemFixture)

      expect(item.id).toBe('srd-2024_adamantine-armor-breastplate')
      expect(item.name).toBe('Adamantine Armor (Breastplate)')
      expect(item.isMagicItem).toBeTruthy()
      expect(item.requiresAttunement).toBeFalsy()
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
  })

  describe('toMagicItem (V1)', () => {
    it('maps core fields using slug as id for wondrous item', () => {
      const item = toMagicItem(open5eV1MagicItemFixture)

      expect(item.id).toBe('bag-of-holding')
      expect(item.name).toBe('Bag of Holding')
      expect(item.isMagicItem).toBeTruthy()
    })

    it('maps type as wondrousItem for wondrous item category', () => {
      const item = toMagicItem(open5eV1MagicItemFixture)

      expect(item.type).toBe('wondrousItem')
      expect(item.weapon).toBeUndefined()
      expect(item.armor).toBeUndefined()
    })

    it('maps rarity with rank 0 for V1', () => {
      const item = toMagicItem(open5eV1MagicItemFixture)

      expect(item.rarity.name).toBe('Uncommon')
      expect(item.rarity.rank).toBe(0)
    })

    it('maps requiresAttunement from empty string as false', () => {
      const item = toMagicItem(open5eV1MagicItemFixture)

      expect(item.requiresAttunement).toBeFalsy()
    })

    it('maps weight and cost', () => {
      const item = toMagicItem(open5eV1MagicItemFixture)

      expect(item.weight).toBe(15)
      expect(item.cost).toBe('0')
    })

    it('maps weapon type and embedded weapon when damage_dice is present', () => {
      const item = toMagicItem(open5eV1MagicItemWeaponFixture)

      expect(item.id).toBe('flame-tongue')
      expect(item.type).toBe('weapon')
      expect(item.weapon).toBeDefined()
      expect(item.weapon!.damageDice).toBe('1d6')
      expect(item.weapon!.damageType).toBe('fire')
    })

    it('maps attunement detail when requires_attunement is non-empty', () => {
      const item = toMagicItem(open5eV1MagicItemWeaponFixture)

      expect(item.requiresAttunement).toBeFalsy()
      expect(item.attunementDetail).toBe('requires attunement')
    })
  })
})
