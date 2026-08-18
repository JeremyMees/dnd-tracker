import { describe, expect, it } from 'vitest'
import { sheet } from '~~/test/fixtures/initiative-sheet'

const emptyRow: InitiativeSheetRow = {
  id: 'test',
  index: 0,
  initiative: 0,
  name: 'test',
  type: 'player',
  conditions: [],
}

const emptyResistances: DndResistancesAndImmunities = {
  damageImmunities: [],
  damageResistances: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
}

describe('dnd/checks', () => {
  describe('hasResistances', () => {
    const empty = {
      damageImmunities: [],
      damageResistances: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
    }

    it('should return false when all arrays are empty', () => {
      expect(hasResistances(empty)).toBeFalsy()
    })

    it('should return true when damageImmunities is not empty', () => {
      expect(
        hasResistances({ ...empty, damageImmunities: ['fire'] }),
      ).toBeTruthy()
    })

    it('should return true when damageResistances is not empty', () => {
      expect(
        hasResistances({ ...empty, damageResistances: ['cold'] }),
      ).toBeTruthy()
    })

    it('should return true when damageVulnerabilities is not empty', () => {
      expect(
        hasResistances({ ...empty, damageVulnerabilities: ['thunder'] }),
      ).toBeTruthy()
    })

    it('should return true when conditionImmunities is not empty', () => {
      expect(
        hasResistances({ ...empty, conditionImmunities: ['charmed'] }),
      ).toBeTruthy()
    })

    it('should return true when multiple fields are populated', () => {
      expect(
        hasResistances({
          ...empty,
          damageImmunities: ['fire'],
          conditionImmunities: ['charmed'],
        }),
      ).toBeTruthy()
    })
  })

  describe('hasMaxCharacters', () => {
    it('should return true when sheet has 50 rows', () => {
      const fullSheet = {
        ...sheet,
        rows: Array(50).fill(sheet.rows[0]),
      }

      expect(hasMaxCharacters(fullSheet)).toBeTruthy()
    })

    it('should return false when sheet has less than 50 rows', () => {
      expect(hasMaxCharacters(sheet)).toBeFalsy()
    })

    it('should return false when sheet is undefined', () => {
      expect(hasMaxCharacters(undefined)).toBeFalsy()
    })
  })

  describe('hasAbilityScores', () => {
    it('should return false when abilityScores is undefined', () => {
      expect(hasAbilityScores(emptyRow)).toBeFalsy()
    })

    it('should return false when abilityScores is an empty object', () => {
      expect(
        hasAbilityScores({
          ...emptyRow,
          abilityScores: {} as DndAbilityScores,
        }),
      ).toBeFalsy()
    })

    it('should return true when abilityScores has at least one entry', () => {
      expect(
        hasAbilityScores({
          ...emptyRow,
          abilityScores: { strength: 10 } as DndAbilityScores,
        }),
      ).toBeTruthy()
    })
  })

  describe('hasCreatureStats', () => {
    it('should return false when all fields are empty', () => {
      expect(
        hasCreatureStats({
          ...emptyRow,
          resistancesAndImmunities: emptyResistances,
        }),
      ).toBeFalsy()
    })

    it('should return true when savingThrows has entries', () => {
      expect(
        hasCreatureStats({
          ...emptyRow,
          savingThrows: { strength: 2 } as DndSavingThrowBonuses,
        }),
      ).toBeTruthy()
    })

    it('should return true when speed has entries', () => {
      expect(
        hasCreatureStats({ ...emptyRow, speed: { walk: 30 } as DndSpeed }),
      ).toBeTruthy()
    })

    it('should return true when sight has entries', () => {
      expect(
        hasCreatureStats({ ...emptyRow, sight: { normalSightRange: 60 } }),
      ).toBeTruthy()
    })

    it('should return true when skillBonuses has entries', () => {
      expect(
        hasCreatureStats({
          ...emptyRow,
          skillBonuses: { perception: 4 } as DndSkillBonuses,
        }),
      ).toBeTruthy()
    })

    it('should return true when languages is not empty', () => {
      expect(
        hasCreatureStats({ ...emptyRow, languages: ['Common'] }),
      ).toBeTruthy()
    })

    it('should return true when traits is not empty', () => {
      expect(
        hasCreatureStats({
          ...emptyRow,
          traits: [{ name: 'Pack Tactics', desc: '...' }],
        }),
      ).toBeTruthy()
    })

    it('should return true when resistancesAndImmunities has entries', () => {
      expect(
        hasCreatureStats({
          ...emptyRow,
          resistancesAndImmunities: {
            ...emptyResistances,
            damageImmunities: ['fire'],
          },
        }),
      ).toBeTruthy()
    })
  })

  describe('concentrationDC', () => {
    it('should return 10 for zero damage', () => {
      expect(concentrationDC(0)).toBe(10)
    })

    it('should return 10 when half damage is below 10', () => {
      expect(concentrationDC(1)).toBe(10)
      expect(concentrationDC(10)).toBe(10)
      expect(concentrationDC(19)).toBe(10)
    })

    it('should return half damage (floored) when it exceeds 10', () => {
      expect(concentrationDC(22)).toBe(11)
      expect(concentrationDC(40)).toBe(20)
      expect(concentrationDC(50)).toBe(25)
    })

    it('should floor half damage for odd numbers', () => {
      expect(concentrationDC(21)).toBe(10)
      expect(concentrationDC(23)).toBe(11)
    })

    it('should return 10 for negative damage', () => {
      expect(concentrationDC(-10)).toBe(10)
    })

    it('should cap at 30', () => {
      expect(concentrationDC(60)).toBe(30)
      expect(concentrationDC(100)).toBe(30)
    })
  })

  const spellShape = { castingOptions: {}, school: 'evocation' } as DndItem
  const magicItemShape = { isMagicItem: true, rarity: {} } as DndItem
  const weaponShape = { damageDice: '1d8', isSimple: true } as DndItem
  const magicWeaponShape = {
    ...weaponShape,
    isMagicItem: true,
  } as unknown as DndItem
  const armorShape = { acDisplay: '14', acBase: 14 } as DndItem
  const magicArmorShape = {
    ...armorShape,
    isMagicItem: true,
  } as unknown as DndItem
  const conditionShape = { desc: 'A Blinded creature cannot see.' } as DndItem
  const monsterShape = { challengeRating: 1, abilityScores: {} } as DndItem

  describe('isSpell', () => {
    it('should return true for an item with castingOptions and school', () => {
      expect(isSpell(spellShape)).toBeTruthy()
    })

    it('should return false for an item missing castingOptions or school', () => {
      expect(isSpell(weaponShape)).toBeFalsy()
      expect(isSpell(conditionShape)).toBeFalsy()
    })
  })

  describe('isMagicItem', () => {
    it('should return true for an item with isMagicItem and rarity', () => {
      expect(isMagicItem(magicItemShape)).toBeTruthy()
    })

    it('should return false for an item missing isMagicItem or rarity', () => {
      expect(isMagicItem(weaponShape)).toBeFalsy()
    })
  })

  describe('isWeapon', () => {
    it('should return true for an item with damageDice and isSimple', () => {
      expect(isWeapon(weaponShape)).toBeTruthy()
    })

    it('should return false when the item is also a magic item', () => {
      expect(isWeapon(magicWeaponShape)).toBeFalsy()
    })

    it('should return false for an item missing damageDice or isSimple', () => {
      expect(isWeapon(armorShape)).toBeFalsy()
    })
  })

  describe('isArmor', () => {
    it('should return true for an item with acDisplay and acBase', () => {
      expect(isArmor(armorShape)).toBeTruthy()
    })

    it('should return false when the item is also a magic item', () => {
      expect(isArmor(magicArmorShape)).toBeFalsy()
    })

    it('should return false for an item missing acDisplay or acBase', () => {
      expect(isArmor(weaponShape)).toBeFalsy()
    })
  })

  describe('isCondition', () => {
    it('should return true for a plain item with only a desc', () => {
      expect(isCondition(conditionShape)).toBeTruthy()
    })

    it('should return false for an item missing desc', () => {
      expect(isCondition(weaponShape)).toBeFalsy()
    })

    it('should return false when the item is a spell, magic item, weapon, or armor', () => {
      expect(
        isCondition({ ...conditionShape, ...spellShape } as DndItem),
      ).toBeFalsy()
      expect(
        isCondition({ ...conditionShape, ...magicItemShape } as DndItem),
      ).toBeFalsy()
      expect(
        isCondition({ ...conditionShape, ...monsterShape } as DndItem),
      ).toBeFalsy()
      expect(
        isCondition({ ...conditionShape, ...weaponShape } as DndItem),
      ).toBeFalsy()
      expect(
        isCondition({ ...conditionShape, ...armorShape } as DndItem),
      ).toBeFalsy()
    })
  })

  describe('isMonster', () => {
    it('should return true for an item with challengeRating and abilityScores', () => {
      expect(isMonster(monsterShape)).toBeTruthy()
    })

    it('should return false for an item missing challengeRating or abilityScores', () => {
      expect(isMonster(weaponShape)).toBeFalsy()
    })
  })
})
