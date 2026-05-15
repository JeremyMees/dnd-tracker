import { mapArmorType } from './utils'

function mapArmorV1(dto: Open5eV1Item): DndArmor {
  const type = mapArmorType(dto.category)
  const strengthScoreRequired = parseIntegerFromText(dto.strength_requirement)

  return {
    id: dto.slug,
    name: dto.name,
    acDisplay: dto.ac_string || dto.armor_desc || `${dto.armor_class}`,
    type,
    grantsStealthDisadvantage: parseBoolean(dto.stealth_disadvantage),
    ...(strengthScoreRequired > 0 ? { strengthScoreRequired } : {}),
    acBase: dto.armor_class,
    acAddDexMod: type !== 'heavy',
    ...(type === 'medium' ? { acCapDexMod: 2 } : {}),
  }
}

function mapArmorV2(dto: Open5eArmor): DndArmor {
  return {
    id: dto.key,
    name: dto.name,
    acDisplay: dto.ac_display,
    type: mapArmorType(dto.category),
    grantsStealthDisadvantage: dto.grants_stealth_disadvantage,
    ...(dto.strength_score_required != null ? { strengthScoreRequired: dto.strength_score_required } : {}),
    acBase: dto.ac_base,
    acAddDexMod: dto.ac_add_dexmod,
    ...(dto.ac_cap_dexmod != null ? { acCapDexMod: dto.ac_cap_dexmod } : {}),
  }
}

export function toArmor(dto: Open5eArmor | Open5eV1Item): DndArmor {
  return 'slug' in dto
    ? mapArmorV1(dto)
    : mapArmorV2(dto)
}
