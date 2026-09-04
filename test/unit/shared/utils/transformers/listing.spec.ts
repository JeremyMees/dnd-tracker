import { describe, expect, it } from 'vitest'
import {
  open5eV2ArmorFixture,
  open5eV2ConditionFixture,
  open5eV2MagicItemFixture,
  open5eV2MonsterFixture,
  open5eV2SpellFixture,
  open5eV2WeaponFixture,
} from '~~/test/fixtures/open5e'
import {
  dndArmorFixture,
  dndConditionFixture,
  dndMagicItemFixture,
  dndMonsterFixture,
  dndSpellFixture,
  dndWeaponFixture,
} from '~~/test/fixtures/open5e/transformed'

const CASES = [
  ['spells', open5eV2SpellFixture, dndSpellFixture],
  ['monsters', open5eV2MonsterFixture, dndMonsterFixture],
  ['conditions', open5eV2ConditionFixture, dndConditionFixture],
  ['magicitems', open5eV2MagicItemFixture, dndMagicItemFixture],
  ['weapons', open5eV2WeaponFixture, dndWeaponFixture],
  ['armor', open5eV2ArmorFixture, dndArmorFixture],
] as const

describe('transformers/listing', () => {
  describe('transformOpen5eItem', () => {
    it.each(CASES)('maps a %s item onto its dnd shape', (type, dto, want) => {
      expect(transformOpen5eItem(type, dto)).toEqual(want)
    })

    it('refuses a type it has no mapper for', () => {
      expect(() =>
        transformOpen5eItem('documents', open5eV2SpellFixture),
      ).toThrow('Unsupported open5e type: documents')
    })
  })

  describe('narrowListing', () => {
    it.each(CASES)(
      'narrows a %s listing to its own union member',
      (type, _dto, item) => {
        expect(narrowListing(type, [item], 3)).toEqual({
          type,
          items: [item],
          pages: 3,
        })
      },
    )

    it.each(CASES)(
      'drops items that belong to another %s listing',
      (type, _dto, item) => {
        const foreign = type === 'spells' ? dndMonsterFixture : dndSpellFixture

        expect(narrowListing(type, [item, foreign], 1)).toEqual({
          type,
          items: [item],
          pages: 1,
        })
      },
    )

    it('keeps an empty listing empty', () => {
      expect(narrowListing('spells', [], 0)).toEqual({
        type: 'spells',
        items: [],
        pages: 0,
      })
    })

    it('refuses a type it cannot narrow', () => {
      expect(() => narrowListing('documents', [], 0)).toThrow(
        'Unsupported open5e type: documents',
      )
    })
  })
})
