import {
  alignmentMap,
  armorTypeMap,
  abilityMap,
  classMap,
  conditionTypes,
  damageTypes,
  magicItemTypeMap,
  monsterTypeMap,
  shapeTypeMap,
  sizeMap,
  skillKeyMap,
  spellSchoolMap,
  usageTypeMap,
} from '~~/constants/dnd'

export function mapDamageType(value: string | null | undefined, fallback: DndDamageType = 'bludgeoning'): DndDamageType {
  const normalized = normalizeKey(value)

  return damageTypes.find(type => normalized.includes(type)) ?? fallback
}

export function mapDamageTypes(input: string | null | undefined): DndDamageType[] {
  const source = splitList(input).map(item => item.toLowerCase())
  const result = new Set<DndDamageType>()

  for (const item of source) {
    for (const type of damageTypes) {
      if (item.includes(type)) result.add(type)
    }
  }

  return [...result]
}

export function mapConditionTypes(input: string | null | undefined): DndConditionType[] {
  const source = splitList(input).map(item => item.toLowerCase())
  const result = new Set<DndConditionType>()

  for (const item of source) {
    for (const type of conditionTypes) {
      if (item.includes(type)) result.add(type)
    }
  }

  return [...result]
}

export function mapMonsterType(value: string | null | undefined): DndMonsterType {
  const key = normalizeKey(value)

  return monsterTypeMap[key] ?? 'humanoid'
}

export function mapSize(value: string | null | undefined): DndSize {
  const key = normalizeKey(value)

  return sizeMap[key] ?? 'medium'
}

export function mapAlignment(value: string | null | undefined): DndAlignment {
  const normalized = normalizeKey(value)

  return alignmentMap[normalized] ?? 'trueNeutral'
}

export function mapArmorType(value: string | null | undefined): DndArmorType {
  const normalized = normalizeKey(value)

  if (normalized.includes('heavy')) return 'heavy'
  if (normalized.includes('medium')) return 'medium'
  if (normalized.includes('light')) return 'light'

  return armorTypeMap[normalized] ?? 'light'
}

export function mapMagicItemType(value: string | null | undefined): DndMagicItemType {
  const normalized = normalizeKey(value)

  for (const [key, mapped] of Object.entries(magicItemTypeMap)) {
    if (normalized.includes(key)) return mapped
  }

  return 'wondrousItem'
}

export function mapSpellSchool(value: string | null | undefined): DndSpellSchool {
  return spellSchoolMap[normalizeKey(value)] ?? 'abjuration'
}

export function mapClasses(value: string | null | undefined): DndClass[] {
  const result = new Set<DndClass>()

  for (const item of splitList(value)) {
    const mapped = classMap[normalizeKey(item)]

    if (mapped) result.add(mapped)
  }

  return [...result]
}

export function mapAbility(value: string | null | undefined, fallback: DndAbility = 'wisdom'): DndAbility {
  return abilityMap[normalizeKey(value)] ?? fallback
}

export function mapShapeType(value: string | null | undefined): DndShapeType | undefined {
  return shapeTypeMap[normalizeKey(value)]
}

export function mapLanguagesV1(input: string): DndLanguage[] {
  return splitList(input).map(name => ({ name, desc: '' }))
}

export function mapDistanceUnit(input: string | null | undefined): DndDistanceUnit {
  return normalizeKey(input).includes('mile') ? 'miles' : 'feet'
}

export function mapWeightUnit(input: string | null | undefined): DndWeightUnit {
  return normalizeKey(input).includes('ton') ? 'tons' : 'pounds'
}

export function parseDiceExpression(value: string | null | undefined, fallback: DndDice = 'd6'): DndDice {
  const match = normalizeKey(value).match(/\d*d(4|6|8|10|12|20|100)/)
  return (match?.[0]?.replace(/^\d+/, '') as DndDice | undefined) ?? fallback
}

export function formatDiceWithCount(value: string | null | undefined, fallback = 'd6'): string {
  const match = normalizeKey(value).match(/(\d*)d(4|6|8|10|12|20|100)/i)

  if (!match) return fallback

  const count = match[1] || '1'

  return `${count}d${match[2]}`
}

export function parseRange(value: string | number | null | undefined): number {
  return parseIntegerFromText(value, 0)
}

export function parseWeight(value: string | number | null | undefined): number {
  return parseNumber(value, 0)
}

export function parseComponents(value: string | null | undefined): { verbal: boolean, somatic: boolean, material: boolean } {
  const normalized = normalizeKey(value)
  const parts = normalized.split(/,|\s+/).filter(Boolean)

  return {
    verbal: parts.includes('v'),
    somatic: parts.includes('s'),
    material: parts.includes('m'),
  }
}

export function parseSenseRange(senses: string, key: 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight'): number | undefined {
  const match = senses.toLowerCase().match(new RegExp(`${key}\\s+(\\d+)`))

  if (!match?.[1]) return undefined

  const value = Number.parseInt(match[1], 10)

  return Number.isFinite(value) ? value : undefined
}

export function mapSightV1(senses: string): DndSight {
  return {
    normalSightRange: 0,
    darkVisionRange: parseSenseRange(senses, 'darkvision'),
    blindSightRange: parseSenseRange(senses, 'blindsight'),
    tremorSenseRange: parseSenseRange(senses, 'tremorsense'),
    trueSightRange: parseSenseRange(senses, 'truesight'),
  }
}

export function mapSkillBonusesV2(skills: Record<string, number>): DndSkillBonuses {
  const mapped = {} as DndSkillBonuses

  for (const [key, value] of Object.entries(skills ?? {})) {
    const mappedKey = skillKeyMap[key] ?? key as DndSkill
    mapped[mappedKey] = value
  }

  return mapped
}

export function mapSkillBonusesV1(skills: Record<string, number>, perception: number): DndSkillBonuses {
  const mapped: DndSkillBonuses = {
    acrobatics: 0,
    animalHandling: 0,
    arcana: 0,
    athletics: 0,
    deception: 0,
    history: 0,
    insight: 0,
    intimidation: 0,
    investigation: 0,
    medicine: 0,
    nature: 0,
    perception,
    performance: 0,
    persuasion: 0,
    religion: 0,
    sleightOfHand: 0,
    stealth: 0,
    survival: 0,
  }

  for (const [key, value] of Object.entries(skills ?? {})) {
    const mappedKey = skillKeyMap[key]

    if (mappedKey) mapped[mappedKey] = value
  }

  return mapped
}

export function mapSavingThrowsV1(item: Open5eV1Item): DndSavingThrowBonuses {
  return {
    strength: parseNumber(item.strength_save, modifierFromScore(item.strength)),
    dexterity: parseNumber(item.dexterity_save, modifierFromScore(item.dexterity)),
    constitution: parseNumber(item.constitution_save, modifierFromScore(item.constitution)),
    intelligence: parseNumber(item.intelligence_save, modifierFromScore(item.intelligence)),
    wisdom: parseNumber(item.wisdom_save, modifierFromScore(item.wisdom)),
    charisma: parseNumber(item.charisma_save, modifierFromScore(item.charisma)),
  }
}

export function mapAttackType(type: string): DndAttackType {
  const normalized = normalizeKey(type)

  if (normalized.includes('melee') && normalized.includes('spell')) return 'meleeSpell'
  if (normalized.includes('ranged') && normalized.includes('spell')) return 'rangedSpell'
  if (normalized.includes('ranged')) return 'ranged'

  return 'melee'
}

export function mapActionType(type: Open5eActionType): DndActionType {
  switch (type) {
    case 'BONUS_ACTION':
      return 'bonusAction'
    case 'REACTION':
      return 'reaction'
    case 'LEGENDARY_ACTION':
      return 'legendaryAction'
    case 'MYTHIC_ACTION':
      return 'mythicAction'
    case 'LAIR_ACTION':
      return 'lairAction'
    default:
      return 'action'
  }
}

export function mapUsageLimits(usage: Open5eUsageLimits | null): DndUsageLimits | undefined {
  if (!usage) return undefined

  const type = usageTypeMap[normalizeKey(usage.type).replace(/\s+/g, '_')]
  if (!type) return undefined

  return {
    type,
    param: usage.param,
  }
}

export function mapAttack(attack: Open5eAttack): DndAttack {
  const damageType = attack.damage_type?.name?.toLowerCase()
  const extraDamageType = attack.extra_damage_type?.name?.toLowerCase()

  return {
    name: attack.name,
    attackType: mapAttackType(attack.attack_type),
    toHitMod: attack.to_hit_mod,
    distanceUnit: mapDistanceUnit(attack.distance_unit),
    ...(attack.reach != null ? { reach: attack.reach } : {}),
    ...(attack.range != null ? { range: attack.range } : {}),
    ...(attack.long_range != null ? { longRange: attack.long_range } : {}),
    ...(attack.target_creature_only ? { targetCreatureOnly: true } : {}),
    ...(attack.damage_die_count != null ? { damageDieCount: attack.damage_die_count } : {}),
    ...(attack.damage_die_type ? { damageDieType: attack.damage_die_type.toLowerCase() as DndDice } : {}),
    ...(attack.damage_bonus != null ? { damageBonus: attack.damage_bonus } : {}),
    ...(damageType ? { damageType: mapDamageType(damageType) } : {}),
    ...(attack.extra_damage_die_count != null ? { extraDamageDieCount: attack.extra_damage_die_count } : {}),
    ...(attack.extra_damage_die_type ? { extraDamageDieType: attack.extra_damage_die_type.toLowerCase() as DndDice } : {}),
    ...(attack.extra_damage_bonus != null ? { extraDamageBonus: attack.extra_damage_bonus } : {}),
    ...(extraDamageType ? { extraDamageType: mapDamageType(extraDamageType) } : {}),
  }
}

export function mapActionsV2(actions: Open5eAction[]): DndAction[] {
  return actions.map(action => ({
    name: action.name,
    desc: action.desc,
    attacks: action.attacks?.map(mapAttack) ?? [],
    actionType: mapActionType(action.action_type),
    ...(action.legendary_action_cost != null ? { legendaryActionCost: action.legendary_action_cost } : {}),
    ...(action.limited_to_form ? { limitedToForm: action.limited_to_form } : {}),
    ...(mapUsageLimits(action.usage_limits) ? { usageLimits: mapUsageLimits(action.usage_limits) } : {}),
  }))
}

export function mapActionsV1(item: Open5eV1Item): DndAction[] {
  const normal = (item.actions ?? []).map(action => ({ ...action, _kind: 'action' as const }))
  const legendary = (item.legendary_actions ?? []).map(action => ({ ...action, _kind: 'legendaryAction' as const }))
  const reactions = (item.reactions ?? []).map(action => ({ ...action, _kind: 'reaction' as const }))

  return [...normal, ...legendary, ...reactions].map((action) => {
    const damageDiceMatch = action.damage_dice?.match(/(\d+)d(4|6|8|10|12|20|100)/i)

    return {
      name: action.name,
      desc: action.desc,
      attacks: (action.attack_bonus != null || damageDiceMatch)
        ? [{
            name: action.name,
            attackType: 'melee',
            toHitMod: action.attack_bonus ?? 0,
            distanceUnit: 'feet',
            ...(action.damage_bonus != null ? { damageBonus: action.damage_bonus } : {}),
            ...(damageDiceMatch
              ? {
                  damageDieCount: Number.parseInt(damageDiceMatch[1]!, 10),
                  damageDieType: `d${damageDiceMatch[2]}` as DndDice,
                }
              : {}),
          }]
        : [],
      actionType: action._kind,
    }
  })
}

export function mapTraitsV1(item: Open5eV1Item): DndTrait[] {
  return (item.special_abilities ?? []).map(trait => ({
    name: trait.name,
    desc: trait.desc,
  }))
}

export function mapSpeedV1(speed: Record<string, number>): DndSpeed {
  return {
    unit: 'feet',
    walk: speed.walk ?? 0,
    ...(speed.fly != null ? { fly: speed.fly } : {}),
    ...(speed.burrow != null ? { burrow: speed.burrow } : {}),
    ...(speed.climb != null ? { climb: speed.climb } : {}),
    ...(speed.swim != null ? { swim: speed.swim } : {}),
  }
}

export function conditionHasLevels(name: string): boolean {
  return normalizeKey(name) === 'exhaustion'
}

export function mapConditionDescription(desc: string | null | undefined, effectsDesc: string[] | null | undefined): string {
  if (desc?.trim()) return desc

  return effectsDesc?.join(' * ') ?? ''
}
