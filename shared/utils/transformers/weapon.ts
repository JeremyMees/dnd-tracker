import {
  formatDiceWithCount,
  mapDamageType,
  mapDistanceUnit,
  parseRange,
} from './utils'

function mapWeaponV1(dto: Open5eV1Item): DndWeapon {
  const range = parseRange(dto.range)

  return {
    id: dto.slug,
    name: dto.name,
    properties: (dto.properties ?? []).map(property => ({
      property: {
        name: property,
        desc: '',
      },
    })),
    damageType: mapDamageType(dto.damage_type),
    distanceUnit: mapDistanceUnit(dto.range),
    damageDice: formatDiceWithCount(dto.damage_dice),
    range,
    longRange: range,
    isSimple: false,
    isImprovised: false,
  }
}

function mapWeaponV2(dto: Open5eWeapon): DndWeapon {
  return {
    id: dto.key,
    name: dto.name,
    properties: dto.properties.map(property => ({
      property: {
        name: property.property.name,
        ...(property.property.type ? { type: property.property.type } : {}),
        desc: property.property.desc,
      },
      ...(property.detail ? { detail: property.detail } : {}),
    })),
    damageType: mapDamageType(dto.damage_type.name),
    distanceUnit: mapDistanceUnit(dto.distance_unit),
    damageDice: formatDiceWithCount(dto.damage_dice),
    range: dto.range,
    longRange: dto.long_range,
    isSimple: dto.is_simple,
    isImprovised: dto.is_improvised,
  }
}

export function toWeapon(dto: Open5eWeapon | Open5eV1Item): DndWeapon {
  return 'slug' in dto
    ? mapWeaponV1(dto)
    : mapWeaponV2(dto)
}
