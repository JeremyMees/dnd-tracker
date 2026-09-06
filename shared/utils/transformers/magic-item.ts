import {
  mapArmorType,
  mapDamageType,
  mapDistanceUnit,
  mapMagicItemType,
  mapSize,
  mapWeightUnit,
  formatDiceWithCount,
  parseWeight,
} from './utils'

export function toMagicItem(dto: Open5eMagicItem): DndMagicItem {
  return {
    id: dto.key,
    name: dto.name,
    desc: dto.desc,
    type: dto.weapon
      ? 'weapon'
      : dto.armor
        ? 'armor'
        : mapMagicItemType(dto.category.name),
    rarity: {
      name: dto.rarity.name,
      rank: dto.rarity.rank,
    },
    isMagicItem: true,
    ...(dto.weapon
      ? {
          weapon: {
            id: dto.weapon.key,
            name: dto.weapon.name,
            properties: dto.weapon.properties.map(property => ({
              property: {
                name: property.property.name,
                ...(property.property.type
                  ? { type: property.property.type }
                  : {}),
                desc: property.property.desc,
              },
              ...(property.detail ? { detail: property.detail } : {}),
            })),
            damageType: mapDamageType(dto.weapon.damage_type.name),
            distanceUnit: mapDistanceUnit(dto.weapon.distance_unit),
            damageDice: formatDiceWithCount(dto.weapon.damage_dice),
            range: dto.weapon.range,
            longRange: dto.weapon.long_range,
            isSimple: dto.weapon.is_simple,
            isImprovised: dto.weapon.is_improvised,
          },
        }
      : {}),
    ...(dto.armor
      ? {
          armor: {
            id: dto.armor.key,
            name: dto.armor.name,
            acDisplay: dto.armor.ac_display,
            type: mapArmorType(dto.armor.category),
            grantsStealthDisadvantage: dto.armor.grants_stealth_disadvantage,
            ...(dto.armor.strength_score_required != null
              ? { strengthScoreRequired: dto.armor.strength_score_required }
              : {}),
            acBase: dto.armor.ac_base,
            acAddDexMod: dto.armor.ac_add_dexmod,
            ...(dto.armor.ac_cap_dexmod != null
              ? { acCapDexMod: dto.armor.ac_cap_dexmod }
              : {}),
          },
        }
      : {}),
    size: mapSize(dto.size.name),
    weight: parseWeight(dto.weight),
    weightUnit: mapWeightUnit(dto.weight_unit),
    cost: dto.cost,
    requiresAttunement: dto.requires_attunement,
    ...(dto.attunement_detail
      ? { attunementDetail: dto.attunement_detail }
      : {}),
  }
}
