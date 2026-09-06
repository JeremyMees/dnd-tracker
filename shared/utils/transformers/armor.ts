import { mapArmorType } from './utils'

export function toArmor(dto: Open5eArmor): DndArmor {
  return {
    id: dto.key,
    name: dto.name,
    acDisplay: dto.ac_display,
    type: mapArmorType(dto.category),
    grantsStealthDisadvantage: dto.grants_stealth_disadvantage,
    ...(dto.strength_score_required != null
      ? { strengthScoreRequired: dto.strength_score_required }
      : {}),
    acBase: dto.ac_base,
    acAddDexMod: dto.ac_add_dexmod,
    ...(dto.ac_cap_dexmod != null ? { acCapDexMod: dto.ac_cap_dexmod } : {}),
  }
}
