import { describe, expect, it } from 'vitest'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'

describe('dnd/creature', () => {
  describe('readInitiativeModifier', () => {
    it('should read a stored modifier as a whole number', () => {
      expect(readInitiativeModifier('3')).toBe(3)
      expect(readInitiativeModifier('-2')).toBe(-2)
      expect(readInitiativeModifier('0')).toBe(0)
      expect(readInitiativeModifier(4)).toBe(4)
    })

    it('should leave out a missing or unreadable modifier', () => {
      expect(readInitiativeModifier(null)).toBeUndefined()
      expect(readInitiativeModifier(undefined)).toBeUndefined()
      expect(readInitiativeModifier('')).toBeUndefined()
      expect(readInitiativeModifier('quick')).toBeUndefined()
    })
  })

  describe('storeInitiativeModifier', () => {
    it('should store a modifier as text', () => {
      expect(storeInitiativeModifier(3)).toBe('3')
      expect(storeInitiativeModifier(-1)).toBe('-1')
      expect(storeInitiativeModifier(0)).toBe('0')
      expect(storeInitiativeModifier('+2')).toBe('2')
    })

    it('should round a fractional modifier', () => {
      expect(storeInitiativeModifier(2.6)).toBe('3')
    })

    it('should store null for a missing or unreadable modifier', () => {
      expect(storeInitiativeModifier(undefined)).toBeNull()
      expect(storeInitiativeModifier(null)).toBeNull()
      expect(storeInitiativeModifier('quick')).toBeNull()
    })

    it('should read back what it stores', () => {
      for (const modifier of [-5, 0, 7]) {
        expect(readInitiativeModifier(storeInitiativeModifier(modifier))).toBe(
          modifier,
        )
      }
    })
  })

  describe('monsterToRow', () => {
    it('should turn a bestiary monster into monster row data', () => {
      const row = monsterToRow(dndMonsterFixture)

      expect(row).toMatchObject({
        name: dndMonsterFixture.name,
        type: 'monster',
        hitPoints: dndMonsterFixture.hitPoints,
        armorClass: dndMonsterFixture.armorClass,
        hitDice: parseDndDiceToString(dndMonsterFixture.hitDice),
        languages: dndMonsterFixture.languages.map(language => language.name),
        initiativeModifier: dndMonsterFixture.initiativeBonus,
      })
    })

    it('should keep the challenge rating', () => {
      const row = monsterToRow(dndMonsterFixture)

      expect(row.challengeRating).toBe(dndMonsterFixture.challengeRating)
    })

    it('should drop the monster fields a row has no place for', () => {
      const row = monsterToRow(dndMonsterFixture)

      for (const field of [
        'size',
        'alignment',
        'experiencePoints',
        'initiativeBonus',
      ]) {
        expect(row).not.toHaveProperty(field)
      }
    })

    it('should leave out a missing proficiency bonus', () => {
      const row = monsterToRow({ ...dndMonsterFixture, proficiencyBonus: null })

      expect(row.proficiencyBonus).toBeUndefined()
    })
  })

  describe('homebrewToRow', () => {
    it('should link the row to the homebrew it came from', () => {
      const row = homebrewToRow(mockHomebrewItem)

      expect(row.homebrew).toBe(mockHomebrewItem.id)
      expect(row).not.toHaveProperty('id')
      expect(row).toMatchObject({
        name: mockHomebrewItem.name,
        type: mockHomebrewItem.type,
        campaign: mockHomebrewItem.campaign,
        hitPoints: mockHomebrewItem.hitPoints,
      })
    })

    it('should turn nulls into undefined', () => {
      const row = homebrewToRow(mockHomebrewItem)

      expect(row.player).toBeUndefined()
      expect(row.link).toBeUndefined()
      expect(row.traits).toBeUndefined()
    })

    it('should parse the stored initiative modifier', () => {
      expect(homebrewToRow(mockHomebrewItem).initiativeModifier).toBe(2)
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: '0' })
          .initiativeModifier,
      ).toBe(0)
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: '' })
          .initiativeModifier,
      ).toBeUndefined()
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: null })
          .initiativeModifier,
      ).toBeUndefined()
    })
  })

  describe('toHomebrewTransfer', () => {
    it('should drop the id, campaign and creation date', () => {
      const result = toHomebrewTransfer(mockHomebrewItem)

      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('campaign')
      expect(result).not.toHaveProperty('createdAt')
      expect(result).toMatchObject({ name: 'Goblin Boss', armorClass: 17 })
    })
  })

  describe('homebrewTransferToRow', () => {
    it('should turn an imported creature into form values', () => {
      expect(
        homebrewTransferToRow({
          ...toHomebrewTransfer(mockHomebrewItem),
          initiativeModifier: '-1',
        }),
      ).toEqual({
        name: 'Goblin Boss',
        type: 'monster',
        actions: [],
        armorClass: 17,
        hitPoints: 21,
        initiativeModifier: -1,
      })
    })

    it('should fall back to a monster without a type', () => {
      expect(homebrewTransferToRow({ name: 'Orc', actions: [] }).type).toBe(
        'monster',
      )
    })
  })
})
