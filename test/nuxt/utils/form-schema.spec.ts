import { describe, expect, it } from 'vitest'

describe('form-schema', () => {
  describe('skillBonusesSchema', () => {
    it('Should accept an empty object (all fields optional)', () => {
      expect(skillBonusesSchema.safeParse({}).success).toBeTruthy()
    })

    it('Should accept valid skill bonuses', () => {
      expect(skillBonusesSchema.safeParse({ acrobatics: 5, stealth: -3, perception: 20 }).success).toBeTruthy()
    })

    it('Should accept boundary values -10 and 20', () => {
      expect(skillBonusesSchema.safeParse({ athletics: -10, arcana: 20 }).success).toBeTruthy()
    })

    it('Should reject values out of range', () => {
      expect(skillBonusesSchema.safeParse({ acrobatics: -11 }).success).toBeFalsy()
      expect(skillBonusesSchema.safeParse({ acrobatics: 21 }).success).toBeFalsy()
    })

    it('Should reject non-number values', () => {
      expect(skillBonusesSchema.safeParse({ acrobatics: 'high' }).success).toBeFalsy()
    })

    it('Should accept all 18 skills', () => {
      const all = {
        acrobatics: 1, animalHandling: 1, arcana: 1, athletics: 1,
        deception: 1, history: 1, insight: 1, intimidation: 1,
        investigation: 1, medicine: 1, nature: 1, perception: 1,
        performance: 1, persuasion: 1, religion: 1, sleightOfHand: 1,
        stealth: 1, survival: 1,
      }
      expect(skillBonusesSchema.safeParse(all).success).toBeTruthy()
    })
  })

  describe('traitSchema', () => {
    const valid = { name: 'Keen Senses', desc: 'The creature has advantage on Perception checks.' }

    it('Should accept a valid trait', () => {
      expect(traitSchema.safeParse(valid).success).toBeTruthy()
    })

    it('Should require name of at least 3 characters', () => {
      expect(traitSchema.safeParse({ ...valid, name: 'AB' }).success).toBeFalsy()
      expect(traitSchema.safeParse({ ...valid, name: 'ABC' }).success).toBeTruthy()
    })

    it('Should reject name longer than 30 characters', () => {
      expect(traitSchema.safeParse({ ...valid, name: 'A'.repeat(31) }).success).toBeFalsy()
    })

    it('Should require desc of at least 10 characters', () => {
      expect(traitSchema.safeParse({ ...valid, desc: 'Too short' }).success).toBeFalsy()
      expect(traitSchema.safeParse({ ...valid, desc: 'Exactly ten' }).success).toBeTruthy()
    })

    it('Should reject desc longer than 1000 characters', () => {
      expect(traitSchema.safeParse({ ...valid, desc: 'A'.repeat(1001) }).success).toBeFalsy()
    })

    it('Should require both name and desc', () => {
      expect(traitSchema.safeParse({ name: 'Keen Senses' }).success).toBeFalsy()
      expect(traitSchema.safeParse({ desc: valid.desc }).success).toBeFalsy()
    })
  })

  describe('abilityScoresSchema', () => {
    it('Should accept an empty object (all optional)', () => {
      expect(abilityScoresSchema.safeParse({}).success).toBeTruthy()
    })

    it('Should accept boundary values 1 and 30', () => {
      expect(abilityScoresSchema.safeParse({ strength: 1, charisma: 30 }).success).toBeTruthy()
    })

    it('Should reject values out of range', () => {
      expect(abilityScoresSchema.safeParse({ strength: 0 }).success).toBeFalsy()
      expect(abilityScoresSchema.safeParse({ strength: 31 }).success).toBeFalsy()
    })

    it('Should accept all six ability scores', () => {
      const all = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
      expect(abilityScoresSchema.safeParse(all).success).toBeTruthy()
    })
  })

  describe('abilityBonusSchema', () => {
    it('Should accept an empty object (all optional)', () => {
      expect(abilityBonusSchema.safeParse({}).success).toBeTruthy()
    })

    it('Should accept boundary values -10 and 20', () => {
      expect(abilityBonusSchema.safeParse({ strength: -10, charisma: 20 }).success).toBeTruthy()
    })

    it('Should reject values out of range', () => {
      expect(abilityBonusSchema.safeParse({ strength: -11 }).success).toBeFalsy()
      expect(abilityBonusSchema.safeParse({ strength: 21 }).success).toBeFalsy()
    })
  })

  describe('speedSchema', () => {
    it('Should accept an empty object (all optional)', () => {
      expect(speedSchema.safeParse({}).success).toBeTruthy()
    })

    it('Should accept valid speeds including hover', () => {
      expect(speedSchema.safeParse({ walk: 30, fly: 60, hover: true }).success).toBeTruthy()
    })

    it('Should accept boundary values 0 and 500', () => {
      expect(speedSchema.safeParse({ walk: 0, fly: 500 }).success).toBeTruthy()
    })

    it('Should reject speeds out of range', () => {
      expect(speedSchema.safeParse({ walk: -1 }).success).toBeFalsy()
      expect(speedSchema.safeParse({ walk: 501 }).success).toBeFalsy()
    })

    it('Should reject non-boolean hover', () => {
      expect(speedSchema.safeParse({ hover: 'yes' }).success).toBeFalsy()
    })
  })

  describe('sightSchema', () => {
    it('Should accept an empty object (all optional)', () => {
      expect(sightSchema.safeParse({}).success).toBeTruthy()
    })

    it('Should accept boundary values 0 and 10000', () => {
      expect(sightSchema.safeParse({ darkVisionRange: 0, trueSightRange: 10000 }).success).toBeTruthy()
    })

    it('Should reject values out of range', () => {
      expect(sightSchema.safeParse({ darkVisionRange: -1 }).success).toBeFalsy()
      expect(sightSchema.safeParse({ darkVisionRange: 10001 }).success).toBeFalsy()
    })

    it('Should accept all five sight types', () => {
      const all = {
        normalSightRange: 60,
        darkVisionRange: 120,
        blindSightRange: 30,
        tremorSenseRange: 60,
        trueSightRange: 60,
      }
      expect(sightSchema.safeParse(all).success).toBeTruthy()
    })
  })

  // ─── attackSchema ─────────────────────────────────────────────────────────────

  describe('attackSchema', () => {
    const valid = { name: 'Claw', attackType: 'melee', distanceUnit: 'feet' }

    it('Should accept a minimal valid attack', () => {
      expect(attackSchema.safeParse(valid).success).toBeTruthy()
    })

    it('Should accept all attack types', () => {
      for (const attackType of ['melee', 'ranged', 'meleeSpell', 'rangedSpell'] as const) {
        expect(attackSchema.safeParse({ ...valid, attackType }).success).toBeTruthy()
      }
    })

    it('Should accept both distance units', () => {
      expect(attackSchema.safeParse({ ...valid, distanceUnit: 'feet' }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, distanceUnit: 'miles' }).success).toBeTruthy()
    })

    it('Should require attackType and distanceUnit', () => {
      const { attackType: _, ...noType } = valid
      expect(attackSchema.safeParse(noType).success).toBeFalsy()

      const { distanceUnit: __, ...noUnit } = valid
      expect(attackSchema.safeParse(noUnit).success).toBeFalsy()
    })

    it('Should reject invalid attackType or distanceUnit', () => {
      expect(attackSchema.safeParse({ ...valid, attackType: 'jump' }).success).toBeFalsy()
      expect(attackSchema.safeParse({ ...valid, distanceUnit: 'meters' }).success).toBeFalsy()
    })

    it('Should accept toHitMod within -20 to 30', () => {
      expect(attackSchema.safeParse({ ...valid, toHitMod: -20 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, toHitMod: 30 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, toHitMod: -21 }).success).toBeFalsy()
      expect(attackSchema.safeParse({ ...valid, toHitMod: 31 }).success).toBeFalsy()
    })

    it('Should accept reach/range/longRange within 0 to 1200', () => {
      expect(attackSchema.safeParse({ ...valid, reach: 0 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, range: 1200 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, reach: -1 }).success).toBeFalsy()
      expect(attackSchema.safeParse({ ...valid, longRange: 1201 }).success).toBeFalsy()
    })

    it('Should accept all valid dice types', () => {
      for (const die of ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const) {
        expect(attackSchema.safeParse({ ...valid, damageDieType: die }).success).toBeTruthy()
      }
      expect(attackSchema.safeParse({ ...valid, damageDieType: 'd5' }).success).toBeFalsy()
    })

    it('Should accept all valid damage types', () => {
      const types = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
        'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'] as const
      for (const damageType of types) {
        expect(attackSchema.safeParse({ ...valid, damageType }).success).toBeTruthy()
      }
      expect(attackSchema.safeParse({ ...valid, damageType: 'cosmic' }).success).toBeFalsy()
    })

    it('Should accept spellSave within 1 to 30', () => {
      expect(attackSchema.safeParse({ ...valid, spellSave: 1 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, spellSave: 30 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, spellSave: 0 }).success).toBeFalsy()
      expect(attackSchema.safeParse({ ...valid, spellSave: 31 }).success).toBeFalsy()
    })

    it('Should accept all valid spellSaveType abilities', () => {
      for (const ability of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const) {
        expect(attackSchema.safeParse({ ...valid, spellSaveType: ability }).success).toBeTruthy()
      }
      expect(attackSchema.safeParse({ ...valid, spellSaveType: 'luck' }).success).toBeFalsy()
    })

    it('Should accept damageDieCount within 1 to 100', () => {
      expect(attackSchema.safeParse({ ...valid, damageDieCount: 1 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, damageDieCount: 100 }).success).toBeTruthy()
      expect(attackSchema.safeParse({ ...valid, damageDieCount: 0 }).success).toBeFalsy()
      expect(attackSchema.safeParse({ ...valid, damageDieCount: 101 }).success).toBeFalsy()
    })
  })

  describe('usageLimitsSchema', () => {
    it('Should accept all valid usage types', () => {
      for (const type of ['perDay', 'recharge', 'atWill', 'perRest'] as const) {
        expect(usageLimitsSchema.safeParse({ type, param: 3 }).success).toBeTruthy()
      }
    })

    it('Should require both type and param', () => {
      expect(usageLimitsSchema.safeParse({ type: 'perDay' }).success).toBeFalsy()
      expect(usageLimitsSchema.safeParse({ param: 3 }).success).toBeFalsy()
    })

    it('Should reject invalid type', () => {
      expect(usageLimitsSchema.safeParse({ type: 'weekly', param: 1 }).success).toBeFalsy()
    })

    it('Should accept param within 1 to 100', () => {
      expect(usageLimitsSchema.safeParse({ type: 'perDay', param: 1 }).success).toBeTruthy()
      expect(usageLimitsSchema.safeParse({ type: 'perDay', param: 100 }).success).toBeTruthy()
      expect(usageLimitsSchema.safeParse({ type: 'perDay', param: 0 }).success).toBeFalsy()
      expect(usageLimitsSchema.safeParse({ type: 'perDay', param: 101 }).success).toBeFalsy()
    })
  })

  describe('actionSchema', () => {
    const valid = {
      actionType: 'action',
      name: 'Bite',
      desc: 'The creature bites.',
      attacks: [],
    }

    it('Should accept a minimal valid action', () => {
      expect(actionSchema.safeParse(valid).success).toBeTruthy()
    })

    it('Should accept all action types', () => {
      const types = ['action', 'bonusAction', 'reaction', 'legendaryAction', 'mythicAction', 'specialAbility', 'lairAction'] as const
      for (const actionType of types) {
        expect(actionSchema.safeParse({ ...valid, actionType }).success).toBeTruthy()
      }
    })

    it('Should require actionType, name and desc', () => {
      const { actionType: _, ...noType } = valid
      expect(actionSchema.safeParse(noType).success).toBeFalsy()

      const { name: __, ...noName } = valid
      expect(actionSchema.safeParse(noName).success).toBeFalsy()

      const { desc: ___, ...noDesc } = valid
      expect(actionSchema.safeParse(noDesc).success).toBeFalsy()
    })

    it('Should reject invalid actionType', () => {
      expect(actionSchema.safeParse({ ...valid, actionType: 'freeAction' }).success).toBeFalsy()
    })

    it('Should enforce name length 3 to 100', () => {
      expect(actionSchema.safeParse({ ...valid, name: 'AB' }).success).toBeFalsy()
      expect(actionSchema.safeParse({ ...valid, name: 'ABC' }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, name: 'A'.repeat(101) }).success).toBeFalsy()
    })

    it('Should enforce desc min length of 1', () => {
      expect(actionSchema.safeParse({ ...valid, desc: '' }).success).toBeFalsy()
    })

    it('Should reject more than 10 attacks', () => {
      const attack = { name: 'Claw', attackType: 'melee', distanceUnit: 'feet' }
      expect(actionSchema.safeParse({ ...valid, attacks: Array.from({ length: 11 }, () => attack) }).success).toBeFalsy()
      expect(actionSchema.safeParse({ ...valid, attacks: Array.from({ length: 10 }, () => attack) }).success).toBeTruthy()
    })

    it('Should accept usageLimits as optional', () => {
      expect(actionSchema.safeParse({ ...valid, usageLimits: undefined }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, usageLimits: { type: 'perDay', param: 3 } }).success).toBeTruthy()
    })

    it('Should reject invalid usageLimits', () => {
      expect(actionSchema.safeParse({ ...valid, usageLimits: { type: 'weekly', param: 1 } }).success).toBeFalsy()
    })

    it('Should enforce legendaryActionCost within 1 to 10', () => {
      expect(actionSchema.safeParse({ ...valid, legendaryActionCost: 1 }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, legendaryActionCost: 10 }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, legendaryActionCost: 0 }).success).toBeFalsy()
      expect(actionSchema.safeParse({ ...valid, legendaryActionCost: 11 }).success).toBeFalsy()
    })

    it('Should accept limitedToForm as optional or empty string', () => {
      expect(actionSchema.safeParse({ ...valid, limitedToForm: '' }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, limitedToForm: 'Beast' }).success).toBeTruthy()
      expect(actionSchema.safeParse({ ...valid, limitedToForm: undefined }).success).toBeTruthy()
    })

    it('Should reject limitedToForm longer than 50 characters', () => {
      expect(actionSchema.safeParse({ ...valid, limitedToForm: 'A'.repeat(51) }).success).toBeFalsy()
    })
  })

  describe('resistancesAndImmunitiesSchema', () => {
    it('Should accept an empty object with default empty arrays', () => {
      const result = resistancesAndImmunitiesSchema.safeParse({})
      expect(result.success).toBeTruthy()
      if (result.success) {
        expect(result.data.damageImmunities).toEqual([])
        expect(result.data.conditionImmunities).toEqual([])
      }
    })

    it('Should accept valid damage types', () => {
      const result = resistancesAndImmunitiesSchema.safeParse({
        damageImmunities: ['fire', 'cold'],
        damageResistances: ['bludgeoning'],
        damageVulnerabilities: ['lightning'],
        conditionImmunities: [],
      })
      expect(result.success).toBeTruthy()
    })

    it('Should accept valid condition types', () => {
      const result = resistancesAndImmunitiesSchema.safeParse({
        conditionImmunities: ['charmed', 'frightened', 'poisoned'],
      })
      expect(result.success).toBeTruthy()
    })

    it('Should reject invalid damage types', () => {
      expect(resistancesAndImmunitiesSchema.safeParse({ damageImmunities: ['cosmic'] }).success).toBeFalsy()
    })

    it('Should reject invalid condition types', () => {
      expect(resistancesAndImmunitiesSchema.safeParse({ conditionImmunities: ['cursed'] }).success).toBeFalsy()
    })

    it('Should accept all valid damage types', () => {
      const allDamageTypes = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning',
        'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder']
      expect(resistancesAndImmunitiesSchema.safeParse({ damageImmunities: allDamageTypes }).success).toBeTruthy()
    })

    it('Should accept all valid condition types', () => {
      const allConditions = ['blinded', 'charmed', 'deafened', 'frightened', 'grappled',
        'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone',
        'restrained', 'stunned', 'unconscious', 'exhaustion']
      expect(resistancesAndImmunitiesSchema.safeParse({ conditionImmunities: allConditions }).success).toBeTruthy()
    })
  })
})
