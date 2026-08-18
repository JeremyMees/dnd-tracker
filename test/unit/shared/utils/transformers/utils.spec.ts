import { describe, expect, it } from 'vitest'

function open5eAttack(overrides: Partial<Open5eAttack> = {}): Open5eAttack {
  return {
    name: 'Tentacle',
    attack_type: 'MELEE_WEAPON',
    to_hit_mod: 9,
    reach: null,
    range: null,
    long_range: null,
    target_creature_only: false,
    damage_die_count: null,
    damage_die_type: null,
    damage_bonus: null,
    damage_type: null,
    extra_damage_die_count: null,
    extra_damage_die_type: null,
    extra_damage_bonus: null,
    extra_damage_type: null,
    distance_unit: 'feet',
    ...overrides,
  }
}

function open5eAction(overrides: Partial<Open5eAction> = {}): Open5eAction {
  return {
    name: 'Multiattack',
    desc: 'The creature attacks twice.',
    attacks: [],
    action_type: 'ACTION',
    order_in_statblock: 0,
    legendary_action_cost: null,
    limited_to_form: null,
    usage_limits: null,
    ...overrides,
  }
}

describe('transformers/utils', () => {
  describe('mapDamageType', () => {
    it('maps known damage types case-insensitively', () => {
      expect(mapDamageType('Slashing')).toBe('slashing')
      expect(mapDamageType('FIRE')).toBe('fire')
      expect(mapDamageType('cold')).toBe('cold')
      expect(mapDamageType('psychic')).toBe('psychic')
    })

    it('returns fallback for unknown types', () => {
      expect(mapDamageType('unknown')).toBe('bludgeoning')
      expect(mapDamageType(null)).toBe('bludgeoning')
      expect(mapDamageType(undefined)).toBe('bludgeoning')
      expect(mapDamageType('unknown', 'fire')).toBe('fire')
    })
  })

  describe('mapDamageTypes', () => {
    it('maps a comma-separated list of damage types', () => {
      expect(mapDamageTypes('fire, cold')).toEqual(['fire', 'cold'])
    })

    it('deduplicates types', () => {
      expect(mapDamageTypes('fire, fire')).toEqual(['fire'])
    })

    it('returns empty array for null input', () => {
      expect(mapDamageTypes(null)).toEqual([])
      expect(mapDamageTypes(undefined)).toEqual([])
    })
  })

  describe('mapMonsterType', () => {
    it('maps known monster types', () => {
      expect(mapMonsterType('aberration')).toBe('aberration')
      expect(mapMonsterType('Beast')).toBe('beast')
      expect(mapMonsterType('UNDEAD')).toBe('undead')
    })

    it('returns humanoid fallback for unknowns', () => {
      expect(mapMonsterType('unknown')).toBe('humanoid')
      expect(mapMonsterType(null)).toBe('humanoid')
    })
  })

  describe('mapSize', () => {
    it('maps known sizes', () => {
      expect(mapSize('tiny')).toBe('tiny')
      expect(mapSize('Large')).toBe('large')
      expect(mapSize('HUGE')).toBe('huge')
    })

    it('returns medium fallback for unknowns', () => {
      expect(mapSize('unknown')).toBe('medium')
      expect(mapSize(null)).toBe('medium')
    })
  })

  describe('mapAlignment', () => {
    it('maps known alignments', () => {
      expect(mapAlignment('chaotic evil')).toBe('chaoticEvil')
      expect(mapAlignment('lawful good')).toBe('lawfulGood')
      expect(mapAlignment('true neutral')).toBe('trueNeutral')
    })

    it('returns trueNeutral fallback for unknowns', () => {
      expect(mapAlignment('unknown')).toBe('trueNeutral')
      expect(mapAlignment(null)).toBe('trueNeutral')
    })
  })

  describe('mapArmorType', () => {
    it('maps heavy, medium, light by substring', () => {
      expect(mapArmorType('Heavy Armor')).toBe('heavy')
      expect(mapArmorType('medium armor')).toBe('medium')
      expect(mapArmorType('Light')).toBe('light')
    })

    it('falls back to light for unknown', () => {
      expect(mapArmorType(null)).toBe('light')
    })
  })

  describe('mapMagicItemType', () => {
    it('maps known magic item categories', () => {
      expect(mapMagicItemType('armor')).toBe('armor')
      expect(mapMagicItemType('potion')).toBe('potion')
      expect(mapMagicItemType('ring')).toBe('ring')
      expect(mapMagicItemType('weapon')).toBe('weapon')
    })

    it('returns wondrousItem fallback for unknowns', () => {
      expect(mapMagicItemType('unknown')).toBe('wondrousItem')
      expect(mapMagicItemType(null)).toBe('wondrousItem')
    })
  })

  describe('mapSpellSchool', () => {
    it('maps known spell schools case-insensitively', () => {
      expect(mapSpellSchool('Evocation')).toBe('evocation')
      expect(mapSpellSchool('ABJURATION')).toBe('abjuration')
      expect(mapSpellSchool('conjuration')).toBe('conjuration')
    })

    it('returns abjuration fallback for unknowns', () => {
      expect(mapSpellSchool('unknown')).toBe('abjuration')
      expect(mapSpellSchool(null)).toBe('abjuration')
    })
  })

  describe('mapClasses', () => {
    it('maps known class names', () => {
      expect(mapClasses('Wizard')).toContain('wizard')
      expect(mapClasses('Cleric')).toContain('cleric')
    })

    it('maps comma-separated list', () => {
      const result = mapClasses('Wizard, Cleric')
      expect(result).toContain('wizard')
      expect(result).toContain('cleric')
    })

    it('skips entries that are not known classes', () => {
      expect(mapClasses('Wizard, Notaclass')).toEqual(['wizard'])
    })

    it('returns empty array for null input', () => {
      expect(mapClasses(null)).toEqual([])
      expect(mapClasses(undefined)).toEqual([])
    })
  })

  describe('mapAbility', () => {
    it('maps known abilities case-insensitively', () => {
      expect(mapAbility('Strength')).toBe('strength')
      expect(mapAbility('DEX')).toBe('dexterity')
      expect(mapAbility('wis')).toBe('wisdom')
    })

    it('returns wisdom fallback for unknowns', () => {
      expect(mapAbility('unknown')).toBe('wisdom')
      expect(mapAbility(null)).toBe('wisdom')
      expect(mapAbility('unknown', 'charisma')).toBe('charisma')
    })
  })

  describe('mapDistanceUnit', () => {
    it('returns miles when input contains "mile"', () => {
      expect(mapDistanceUnit('1 mile')).toBe('miles')
      expect(mapDistanceUnit('60 miles')).toBe('miles')
    })

    it('returns feet for all other inputs', () => {
      expect(mapDistanceUnit('90 feet')).toBe('feet')
      expect(mapDistanceUnit(null)).toBe('feet')
    })
  })

  describe('mapWeightUnit', () => {
    it('returns tons when input contains "ton"', () => {
      expect(mapWeightUnit('2 tons')).toBe('tons')
    })

    it('returns pounds for all other inputs', () => {
      expect(mapWeightUnit('10 lb')).toBe('pounds')
      expect(mapWeightUnit(null)).toBe('pounds')
    })
  })

  describe('parseDiceExpression', () => {
    it('extracts die type from expression', () => {
      expect(parseDiceExpression('1d8')).toBe('d8')
      expect(parseDiceExpression('2d6')).toBe('d6')
      expect(parseDiceExpression('d10')).toBe('d10')
    })

    it('returns fallback for invalid input', () => {
      expect(parseDiceExpression(null)).toBe('d6')
      expect(parseDiceExpression('invalid')).toBe('d6')
      expect(parseDiceExpression(null, 'd8')).toBe('d8')
    })
  })

  describe('formatDiceWithCount', () => {
    it('formats with explicit count', () => {
      expect(formatDiceWithCount('2d6')).toBe('2d6')
      expect(formatDiceWithCount('1d8')).toBe('1d8')
    })

    it('defaults count to 1 when omitted', () => {
      expect(formatDiceWithCount('d10')).toBe('1d10')
    })

    it('returns fallback for invalid input', () => {
      expect(formatDiceWithCount(null)).toBe('d6')
      expect(formatDiceWithCount('invalid')).toBe('d6')
      expect(formatDiceWithCount(null, '1d4')).toBe('1d4')
    })
  })

  describe('parseRange', () => {
    it('extracts integer from string', () => {
      expect(parseRange('90 feet')).toBe(90)
      expect(parseRange('5 ft.')).toBe(5)
    })

    it('returns 0 for null or non-integer strings', () => {
      expect(parseRange(null)).toBe(0)
      expect(parseRange('Touch')).toBe(0)
    })
  })

  describe('parseWeight', () => {
    it('parses numeric weight strings', () => {
      expect(parseWeight('20.000')).toBe(20)
      expect(parseWeight('1.5')).toBe(1.5)
    })

    it('returns 0 for null', () => {
      expect(parseWeight(null)).toBe(0)
    })
  })

  describe('parseComponents', () => {
    it('detects verbal, somatic and material components', () => {
      expect(parseComponents('V, S, M')).toEqual({
        verbal: true,
        somatic: true,
        material: true,
      })
      expect(parseComponents('V, S')).toEqual({
        verbal: true,
        somatic: true,
        material: false,
      })
      expect(parseComponents('M')).toEqual({
        verbal: false,
        somatic: false,
        material: true,
      })
    })

    it('handles lowercase and extra spaces', () => {
      expect(parseComponents('v, s, m')).toEqual({
        verbal: true,
        somatic: true,
        material: true,
      })
    })

    it('returns all false for empty input', () => {
      expect(parseComponents(null)).toEqual({
        verbal: false,
        somatic: false,
        material: false,
      })
      expect(parseComponents('')).toEqual({
        verbal: false,
        somatic: false,
        material: false,
      })
    })
  })

  describe('parseSenseRange', () => {
    it('extracts range for each sense keyword', () => {
      expect(
        parseSenseRange('darkvision 60 ft., blindsight 30 ft.', 'darkvision'),
      ).toBe(60)
      expect(
        parseSenseRange('darkvision 60 ft., blindsight 30 ft.', 'blindsight'),
      ).toBe(30)
    })

    it('returns undefined when sense is not present', () => {
      expect(parseSenseRange('darkvision 60 ft.', 'truesight')).toBeUndefined()
    })
  })

  describe('mapAttackType', () => {
    it('maps melee and ranged spell attacks', () => {
      expect(mapAttackType('melee spell attack')).toBe('meleeSpell')
      expect(mapAttackType('ranged spell attack')).toBe('rangedSpell')
    })

    it('maps ranged weapon attacks', () => {
      expect(mapAttackType('ranged weapon attack')).toBe('ranged')
    })

    it('defaults to melee', () => {
      expect(mapAttackType('WEAPON')).toBe('melee')
      expect(mapAttackType('melee weapon attack')).toBe('melee')
    })
  })

  describe('mapActionType', () => {
    it('maps all Open5e action types', () => {
      expect(mapActionType('BONUS_ACTION')).toBe('bonusAction')
      expect(mapActionType('REACTION')).toBe('reaction')
      expect(mapActionType('LEGENDARY_ACTION')).toBe('legendaryAction')
      expect(mapActionType('MYTHIC_ACTION')).toBe('mythicAction')
      expect(mapActionType('LAIR_ACTION')).toBe('lairAction')
    })

    it('defaults to action for ACTION and unknown', () => {
      expect(mapActionType('ACTION')).toBe('action')
      expect(mapActionType('UNKNOWN' as unknown as Open5eActionType)).toBe(
        'action',
      )
    })
  })

  describe('mapShapeType', () => {
    it('maps known shape types', () => {
      expect(mapShapeType('sphere')).toBeDefined()
      expect(mapShapeType('cone')).toBeDefined()
    })

    it('returns undefined for unknown shapes', () => {
      expect(mapShapeType('unknown')).toBeUndefined()
      expect(mapShapeType(null)).toBeUndefined()
    })
  })

  describe('conditionHasLevels', () => {
    it('returns true only for exhaustion', () => {
      expect(conditionHasLevels('exhaustion')).toBeTruthy()
      expect(conditionHasLevels('Exhaustion')).toBeTruthy()
    })

    it('returns false for other conditions', () => {
      expect(conditionHasLevels('blinded')).toBeFalsy()
      expect(conditionHasLevels('poisoned')).toBeFalsy()
    })
  })

  describe('mapConditionDescription', () => {
    it('returns desc when it has content', () => {
      expect(mapConditionDescription('main desc', ['effect 1'])).toBe(
        'main desc',
      )
    })

    it('joins effectsDesc when desc is empty', () => {
      expect(mapConditionDescription('', ['effect 1', 'effect 2'])).toBe(
        'effect 1 * effect 2',
      )
      expect(mapConditionDescription(null, ['only effect'])).toBe('only effect')
    })

    it('returns empty string when both are empty', () => {
      expect(mapConditionDescription(null, null)).toBe('')
      expect(mapConditionDescription('', [])).toBe('')
    })
  })

  describe('mapUsageLimits', () => {
    it('maps a known usage type', () => {
      expect(mapUsageLimits({ type: 'PER_DAY', param: 3 })).toEqual({
        type: 'perDay',
        param: 3,
      })
      expect(mapUsageLimits({ type: 'recharge', param: 5 })).toEqual({
        type: 'recharge',
        param: 5,
      })
    })

    it('returns undefined for no usage limits', () => {
      expect(mapUsageLimits(null)).toBeUndefined()
    })

    it('returns undefined for an unknown usage type', () => {
      expect(mapUsageLimits({ type: 'per eclipse', param: 1 })).toBeUndefined()
    })
  })

  describe('mapAttack', () => {
    it('omits every optional field the api left null', () => {
      expect(mapAttack(open5eAttack())).toEqual({
        name: 'Tentacle',
        attackType: 'melee',
        toHitMod: 9,
        distanceUnit: 'feet',
      })
    })

    it('maps every optional field when present', () => {
      const attack = mapAttack(
        open5eAttack({
          reach: 10,
          range: 30,
          long_range: 120,
          target_creature_only: true,
          damage_die_count: 2,
          damage_die_type: 'D6',
          damage_bonus: 5,
          damage_type: { name: 'Bludgeoning', key: 'bludgeoning', url: '' },
          extra_damage_die_count: 3,
          extra_damage_die_type: 'D8',
          extra_damage_bonus: 1,
          extra_damage_type: { name: 'Acid', key: 'acid', url: '' },
        }),
      )

      expect(attack).toEqual({
        name: 'Tentacle',
        attackType: 'melee',
        toHitMod: 9,
        distanceUnit: 'feet',
        reach: 10,
        range: 30,
        longRange: 120,
        targetCreatureOnly: true,
        damageDieCount: 2,
        damageDieType: 'd6',
        damageBonus: 5,
        damageType: 'bludgeoning',
        extraDamageDieCount: 3,
        extraDamageDieType: 'd8',
        extraDamageBonus: 1,
        extraDamageType: 'acid',
      })
    })
  })

  describe('mapActionsV2', () => {
    it('omits optional fields that are absent', () => {
      expect(mapActionsV2([open5eAction()])).toEqual([
        {
          name: 'Multiattack',
          desc: 'The creature attacks twice.',
          attacks: [],
          actionType: 'action',
        },
      ])
    })

    it('maps legendary cost, form limit and usage limits', () => {
      const [action] = mapActionsV2([
        open5eAction({
          action_type: 'LEGENDARY_ACTION',
          legendary_action_cost: 2,
          limited_to_form: 'Hybrid',
          usage_limits: { type: 'PER_DAY', param: 3 },
        }),
      ])

      expect(action!.actionType).toBe('legendaryAction')
      expect(action!.legendaryActionCost).toBe(2)
      expect(action!.limitedToForm).toBe('Hybrid')
      expect(action!.usageLimits).toEqual({ type: 'perDay', param: 3 })
    })

    it('drops usage limits the api reports with an unknown type', () => {
      const [action] = mapActionsV2([
        open5eAction({ usage_limits: { type: 'per eclipse', param: 1 } }),
      ])

      expect(action!.usageLimits).toBeUndefined()
    })

    it('defaults to no attacks when the api omits the array', () => {
      const [action] = mapActionsV2([
        { ...open5eAction(), attacks: undefined } as unknown as Open5eAction,
      ])

      expect(action!.attacks).toEqual([])
    })

    it('maps nested attacks', () => {
      const [action] = mapActionsV2([
        open5eAction({ attacks: [open5eAttack({ reach: 10 })] }),
      ])

      expect(action!.attacks).toHaveLength(1)
      expect(action!.attacks[0]!.reach).toBe(10)
    })
  })

  describe('mapActionsV1', () => {
    it('tags actions, legendary actions and reactions', () => {
      const actions = mapActionsV1({
        actions: [{ name: 'Bite', desc: 'Bites.' }],
        legendary_actions: [{ name: 'Move', desc: 'Moves.' }],
        reactions: [{ name: 'Parry', desc: 'Parries.' }],
      } as unknown as Open5eV1Item)

      expect(actions.map(action => action.actionType)).toEqual([
        'action',
        'legendaryAction',
        'reaction',
      ])
    })

    it('returns an empty list when every action array is missing', () => {
      expect(mapActionsV1({} as unknown as Open5eV1Item)).toEqual([])
    })

    it('builds an attack from the attack bonus alone', () => {
      const [action] = mapActionsV1({
        actions: [{ name: 'Bite', desc: 'Bites.', attack_bonus: 4 }],
      } as unknown as Open5eV1Item)

      expect(action!.attacks).toEqual([
        {
          name: 'Bite',
          attackType: 'melee',
          toHitMod: 4,
          distanceUnit: 'feet',
        },
      ])
    })

    it('builds an attack from the damage dice alone', () => {
      const [action] = mapActionsV1({
        actions: [
          { name: 'Slam', desc: 'Slams.', damage_dice: '2d8', damage_bonus: 3 },
        ],
      } as unknown as Open5eV1Item)

      expect(action!.attacks[0]).toEqual({
        name: 'Slam',
        attackType: 'melee',
        toHitMod: 0,
        distanceUnit: 'feet',
        damageBonus: 3,
        damageDieCount: 2,
        damageDieType: 'd8',
      })
    })

    it('produces no attacks for a descriptive action', () => {
      const [action] = mapActionsV1({
        actions: [{ name: 'Multiattack', desc: 'Attacks twice.' }],
      } as unknown as Open5eV1Item)

      expect(action!.attacks).toEqual([])
    })
  })

  describe('mapTraitsV1', () => {
    it('maps special abilities to traits', () => {
      expect(
        mapTraitsV1({
          special_abilities: [{ name: 'Amphibious', desc: 'Breathes water.' }],
        } as unknown as Open5eV1Item),
      ).toEqual([{ name: 'Amphibious', desc: 'Breathes water.' }])
    })

    it('returns an empty list when special abilities are missing', () => {
      expect(mapTraitsV1({} as unknown as Open5eV1Item)).toEqual([])
    })
  })

  describe('mapSpeedV1', () => {
    it('defaults walk to 0 and omits absent movement types', () => {
      expect(mapSpeedV1({})).toEqual({ unit: 'feet', walk: 0 })
    })

    it('maps every movement type that is present', () => {
      expect(
        mapSpeedV1({ walk: 30, fly: 60, burrow: 10, climb: 20, swim: 40 }),
      ).toEqual({
        unit: 'feet',
        walk: 30,
        fly: 60,
        burrow: 10,
        climb: 20,
        swim: 40,
      })
    })
  })

  describe('mapSkillBonusesV2', () => {
    it('maps snake_case keys and passes unknown keys through', () => {
      expect(mapSkillBonusesV2({ animal_handling: 5, telepathy: 2 })).toEqual({
        animalHandling: 5,
        telepathy: 2,
      })
    })

    it('returns an empty object when there are no skills', () => {
      expect(
        mapSkillBonusesV2(null as unknown as Record<string, number>),
      ).toEqual({})
    })
  })

  describe('mapSkillBonusesV1', () => {
    it('ignores keys that are not known skills', () => {
      const bonuses = mapSkillBonusesV1({ stealth: 6, telepathy: 2 }, 9)

      expect(bonuses.stealth).toBe(6)
      expect(bonuses.perception).toBe(9)
      expect(bonuses).not.toHaveProperty('telepathy')
    })

    it('falls back to zeroed bonuses when there are no skills', () => {
      const bonuses = mapSkillBonusesV1(
        null as unknown as Record<string, number>,
        11,
      )

      expect(bonuses.stealth).toBe(0)
      expect(bonuses.perception).toBe(11)
    })
  })
})
