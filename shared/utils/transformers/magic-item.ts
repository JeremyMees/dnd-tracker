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

function mapMagicItemWeaponV1(dto: Open5eV1Item): DndWeapon | undefined {
  if (!dto.damage_dice) return undefined

  const range = parseIntegerFromText(dto.range)

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

function mapMagicItemArmorV1(dto: Open5eV1Item): DndArmor | undefined {
  if (!dto.ac_string && dto.armor_class == null) return undefined

  const type = mapArmorType(dto.category)
  const strengthScoreRequired = parseIntegerFromText(dto.strength_requirement)

  return {
    id: dto.slug,
    name: dto.name,
    acDisplay: dto.ac_string || `${dto.armor_class}`,
    type,
    grantsStealthDisadvantage: parseBoolean(dto.stealth_disadvantage),
    ...(strengthScoreRequired > 0 ? { strengthScoreRequired } : {}),
    acBase: dto.armor_class,
    acAddDexMod: type !== 'heavy',
    ...(type === 'medium' ? { acCapDexMod: 2 } : {}),
  }
}

function mapMagicItemV1(dto: Open5eV1Item): DndMagicItem {
  const weapon = mapMagicItemWeaponV1(dto)
  const armor = mapMagicItemArmorV1(dto)

  return {
    id: dto.slug,
    name: dto.name,
    desc: dto.desc,
    type: weapon ? 'weapon' : armor ? 'armor' : mapMagicItemType(dto.category || dto.rarity),
    rarity: {
      name: dto.rarity || 'Common',
      rank: 0,
    },
    isMagicItem: true,
    ...(weapon ? { weapon } : {}),
    ...(armor ? { armor } : {}),
    size: 'medium',
    weight: parseWeight(dto.weight),
    weightUnit: mapWeightUnit(dto.weight),
    cost: dto.cost || '',
    requiresAttunement: parseBoolean(dto.requires_attunement),
    ...(dto.requires_attunement ? { attunementDetail: dto.requires_attunement } : {}),
  }
}

function mapMagicItemV2(dto: Open5eMagicItem): DndMagicItem {
  return {
    id: dto.key,
    name: dto.name,
    desc: dto.desc,
    type: dto.weapon ? 'weapon' : dto.armor ? 'armor' : mapMagicItemType(dto.category.name),
    rarity: {
      name: dto.rarity.name,
      rank: dto.rarity.rank,
    },
    isMagicItem: dto.is_magic_item,
    ...(dto.weapon
      ? {
          weapon: {
            id: dto.weapon.key,
            name: dto.weapon.name,
            properties: dto.weapon.properties.map(property => ({
              property: {
                name: property.property.name,
                ...(property.property.type ? { type: property.property.type } : {}),
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
            ...(dto.armor.strength_score_required != null ? { strengthScoreRequired: dto.armor.strength_score_required } : {}),
            acBase: dto.armor.ac_base,
            acAddDexMod: dto.armor.ac_add_dexmod,
            ...(dto.armor.ac_cap_dexmod != null ? { acCapDexMod: dto.armor.ac_cap_dexmod } : {}),
          },
        }
      : {}),
    size: mapSize(dto.size.name),
    weight: parseWeight(dto.weight),
    weightUnit: mapWeightUnit(dto.weight_unit),
    cost: dto.cost,
    requiresAttunement: dto.requires_attunement,
    ...(dto.attunement_detail ? { attunementDetail: dto.attunement_detail } : {}),
  }
}

export function toMagicItem(dto: Open5eMagicItem | Open5eV1Item): DndMagicItem {
  return 'slug' in dto
    ? mapMagicItemV1(dto)
    : mapMagicItemV2(dto)
}
