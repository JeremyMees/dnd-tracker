import {
  mapActionsV1,
  mapActionsV2,
  mapAlignment,
  mapConditionTypes,
  mapDamageType,
  mapDamageTypes,
  mapLanguagesV1,
  mapMonsterType,
  mapSavingThrowsV1,
  mapSightV1,
  mapSize,
  mapSkillBonusesV1,
  mapSkillBonusesV2,
  mapSpeedV1,
  mapTraitsV1,
} from './utils'

function mapMonsterV1(dto: Open5eV1Item): DndMonster {
  const abilityScores: DndAbilityScores = {
    strength: dto.strength,
    dexterity: dto.dexterity,
    constitution: dto.constitution,
    intelligence: dto.intelligence,
    wisdom: dto.wisdom,
    charisma: dto.charisma,
  }

  const modifiers: DndModifiers = {
    strength: modifierFromScore(dto.strength),
    dexterity: modifierFromScore(dto.dexterity),
    constitution: modifierFromScore(dto.constitution),
    intelligence: modifierFromScore(dto.intelligence),
    wisdom: modifierFromScore(dto.wisdom),
    charisma: modifierFromScore(dto.charisma),
  }

  return {
    id: dto.slug,
    name: dto.name,
    type: mapMonsterType(dto.type || dto.category),
    size: mapSize(dto.size),
    challengeRating: dto.cr,
    proficiencyBonus: undefined,
    speed: mapSpeedV1(dto.speed),
    alignment: mapAlignment(dto.alignment),
    languages: mapLanguagesV1(dto.languages),
    armorClass: dto.armor_class,
    armorDetail: dto.armor_desc,
    hitPoints: dto.hit_points,
    hitDice: parseHitDice(dto.hit_dice),
    experiencePoints: dto.xp ?? 0,
    abilityScores,
    modifiers,
    initiativeBonus: modifiers.dexterity,
    savingThrows: mapSavingThrowsV1(dto),
    skillBonuses: mapSkillBonusesV1(dto.skills, dto.perception),
    passivePerception: dto.perception,
    resistancesAndImmunities: {
      damageImmunities: mapDamageTypes(dto.damage_immunities),
      damageResistances: mapDamageTypes(dto.damage_resistances),
      damageVulnerabilities: mapDamageTypes(dto.damage_vulnerabilities),
      conditionImmunities: mapConditionTypes(dto.condition_immunities),
    },
    sight: mapSightV1(dto.senses),
    actions: mapActionsV1(dto),
    traits: mapTraitsV1(dto),
  }
}

function mapMonsterV2(dto: Open5eMonster): DndMonster {
  return {
    id: dto.key,
    name: dto.name,
    type: mapMonsterType(dto.type.name || dto.category),
    size: mapSize(dto.size.name),
    challengeRating: dto.challenge_rating,
    proficiencyBonus: dto.proficiency_bonus ?? undefined,
    speed: {
      unit: 'feet',
      walk: dto.speed_all.walk,
      ...(dto.speed_all.fly != null ? { fly: dto.speed_all.fly } : {}),
      ...(dto.speed_all.burrow != null ? { burrow: dto.speed_all.burrow } : {}),
      ...(dto.speed_all.climb != null ? { climb: dto.speed_all.climb } : {}),
      ...(dto.speed_all.swim != null ? { swim: dto.speed_all.swim } : {}),
      ...(dto.speed_all.crawl != null ? { crawl: dto.speed_all.crawl } : {}),
      ...(dto.speed_all.hover != null ? { hover: dto.speed_all.hover } : {}),
    },
    alignment: mapAlignment(dto.alignment),
    languages: dto.languages.data.map(language => ({
      name: language.name,
      desc: language.desc,
    })),
    armorClass: dto.armor_class,
    armorDetail: dto.armor_detail,
    hitPoints: dto.hit_points,
    hitDice: parseHitDice(dto.hit_dice),
    experiencePoints: dto.experience_points,
    abilityScores: dto.ability_scores,
    modifiers: dto.modifiers,
    initiativeBonus: dto.initiative_bonus,
    savingThrows: dto.saving_throws_all,
    skillBonuses: mapSkillBonusesV2(dto.skill_bonuses_all as unknown as Record<string, number>),
    passivePerception: dto.passive_perception,
    resistancesAndImmunities: {
      damageImmunities: dto.resistances_and_immunities.damage_immunities
        .map(entry => mapDamageType(entry.name)),
      damageResistances: dto.resistances_and_immunities.damage_resistances
        .map(entry => mapDamageType(entry.name)),
      damageVulnerabilities: dto.resistances_and_immunities.damage_vulnerabilities
        .map(entry => mapDamageType(entry.name)),
      conditionImmunities: dto.resistances_and_immunities.condition_immunities
        .flatMap(entry => mapConditionTypes(entry.name)),
    },
    sight: {
      normalSightRange: dto.normal_sight_range ?? 0,
      darkVisionRange: dto.darkvision_range ?? undefined,
      blindSightRange: dto.blindsight_range ?? undefined,
      tremorSenseRange: dto.tremorsense_range ?? undefined,
      trueSightRange: dto.truesight_range ?? undefined,
    },
    actions: mapActionsV2(dto.actions ?? []),
    traits: (dto.traits ?? []).map(trait => ({
      name: trait.name,
      desc: trait.desc,
    })),
  }
}

export function toMonster(dto: Open5eMonster | Open5eV1Item): DndMonster {
  return 'slug' in dto
    ? mapMonsterV1(dto)
    : mapMonsterV2(dto)
}
