import { parseHitDice } from '../dnd/dice'
import {
  mapActionsV2,
  mapAlignment,
  mapConditionTypes,
  mapDamageType,
  mapMonsterType,
  mapSize,
  mapSkillBonusesV2,
} from './utils'

export function toMonster(dto: Open5eMonster): DndMonster {
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
    skillBonuses: mapSkillBonusesV2(
      dto.skill_bonuses_all as unknown as Record<string, number>,
    ),
    passivePerception: dto.passive_perception,
    resistancesAndImmunities: {
      damageImmunities: dto.resistances_and_immunities.damage_immunities.map(
        entry => mapDamageType(entry.name),
      ),
      damageResistances: dto.resistances_and_immunities.damage_resistances.map(
        entry => mapDamageType(entry.name),
      ),
      damageVulnerabilities:
        dto.resistances_and_immunities.damage_vulnerabilities.map(entry =>
          mapDamageType(entry.name),
        ),
      conditionImmunities:
        dto.resistances_and_immunities.condition_immunities.flatMap(entry =>
          mapConditionTypes(entry.name),
        ),
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
