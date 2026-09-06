import { formatDiceWithCount, mapDamageType, mapDistanceUnit } from './utils'

export function toWeapon(dto: Open5eWeapon): DndWeapon {
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
