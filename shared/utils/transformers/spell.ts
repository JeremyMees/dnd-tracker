import {
  mapAbility,
  mapClasses,
  mapDamageTypes,
  mapDistanceUnit,
  mapShapeType,
  mapSpellSchool,
  parseComponents,
  parseRange,
} from './utils'

function mapSpellV1(dto: Open5eV1Item): DndSpell {
  const components = parseComponents(dto.components)

  return {
    id: dto.slug,
    name: dto.name,
    castingOptions: [],
    school: mapSpellSchool(dto.school),
    classes: mapClasses(dto.dnd_class),
    rangeUnit: mapDistanceUnit(dto.range),
    shapeSizeUnit: mapDistanceUnit(dto.range),
    desc: dto.desc,
    level: parseNumber(dto.level),
    higherLevel: dto.higher_level || '',
    targetType: '',
    rangeText: dto.range || '',
    range: parseRange(dto.range),
    ritual: parseBoolean(dto.ritual),
    castingTime: dto.casting_time || '',
    verbal: components.verbal,
    somatic: components.somatic,
    material: components.material,
    materialSpecified: dto.material || '',
    materialConsumed: false,
    targetCount: 1,
    savingThrowAbility: mapAbility(undefined),
    attackRoll: false,
    damageRoll: '',
    damageTypes: mapDamageTypes(dto.desc),
    duration: dto.duration || '',
    concentration: parseBoolean(dto.concentration),
  }
}

function mapSpellV2(dto: Open5eSpell): DndSpell {
  const shapeType = mapShapeType(dto.shape_type)

  return {
    id: dto.key,
    name: dto.name,
    castingOptions: dto.casting_options.map(option => ({
      type: option.type,
      ...(option.damage_roll ? { damageRoll: option.damage_roll } : {}),
      ...(option.target_count != null ? { targetCount: option.target_count } : {}),
      ...(option.duration ? { duration: option.duration } : {}),
      ...(option.range != null ? { range: option.range } : {}),
      ...(option.concentration != null ? { concentration: option.concentration } : {}),
      ...(option.shape_size != null ? { shapeSize: option.shape_size } : {}),
      ...(option.desc ? { desc: option.desc } : {}),
    })),
    school: mapSpellSchool(dto.school.name),
    classes: dto.classes.flatMap(item => mapClasses(item.name)),
    rangeUnit: mapDistanceUnit(dto.range_unit),
    shapeSizeUnit: mapDistanceUnit(dto.shape_size_unit),
    desc: dto.desc,
    level: dto.level,
    higherLevel: dto.higher_level,
    targetType: dto.target_type,
    rangeText: dto.range_text,
    range: dto.range,
    ritual: dto.ritual,
    castingTime: dto.casting_time,
    ...(dto.reaction_condition ? { reactionCondition: dto.reaction_condition } : {}),
    verbal: dto.verbal,
    somatic: dto.somatic,
    material: dto.material,
    materialSpecified: dto.material_specified,
    ...(dto.material_cost != null ? { materialCost: dto.material_cost } : {}),
    materialConsumed: dto.material_consumed,
    targetCount: dto.target_count,
    savingThrowAbility: mapAbility(dto.saving_throw_ability),
    attackRoll: dto.attack_roll,
    damageRoll: dto.damage_roll,
    damageTypes: dto.damage_types.flatMap(type => mapDamageTypes(type)),
    duration: dto.duration,
    ...(shapeType ? { shapeType } : {}),
    ...(dto.shape_size != null ? { shapeSize: dto.shape_size } : {}),
    concentration: dto.concentration,
  }
}

export function toSpell(dto: Open5eSpell | Open5eV1Item): DndSpell {
  return 'slug' in dto ? mapSpellV1(dto) : mapSpellV2(dto)
}
