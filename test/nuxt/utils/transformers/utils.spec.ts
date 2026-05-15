import { describe, expect, it } from 'vitest'

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
      expect(parseComponents('V, S, M')).toEqual({ verbal: true, somatic: true, material: true })
      expect(parseComponents('V, S')).toEqual({ verbal: true, somatic: true, material: false })
      expect(parseComponents('M')).toEqual({ verbal: false, somatic: false, material: true })
    })

    it('handles lowercase and extra spaces', () => {
      expect(parseComponents('v, s, m')).toEqual({ verbal: true, somatic: true, material: true })
    })

    it('returns all false for empty input', () => {
      expect(parseComponents(null)).toEqual({ verbal: false, somatic: false, material: false })
      expect(parseComponents('')).toEqual({ verbal: false, somatic: false, material: false })
    })
  })

  describe('parseSenseRange', () => {
    it('extracts range for each sense keyword', () => {
      expect(parseSenseRange('darkvision 60 ft., blindsight 30 ft.', 'darkvision')).toBe(60)
      expect(parseSenseRange('darkvision 60 ft., blindsight 30 ft.', 'blindsight')).toBe(30)
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
      expect(mapActionType('UNKNOWN' as any)).toBe('action')
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
      expect(mapConditionDescription('main desc', ['effect 1'])).toBe('main desc')
    })

    it('joins effectsDesc when desc is empty', () => {
      expect(mapConditionDescription('', ['effect 1', 'effect 2'])).toBe('effect 1 * effect 2')
      expect(mapConditionDescription(null, ['only effect'])).toBe('only effect')
    })

    it('returns empty string when both are empty', () => {
      expect(mapConditionDescription(null, null)).toBe('')
      expect(mapConditionDescription('', [])).toBe('')
    })
  })
})
