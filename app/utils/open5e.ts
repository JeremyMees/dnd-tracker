export function isSpell(item: Open5eItem): item is Open5eSpell {
  return 'level' in item && 'school' in item
}

export function isMagicItem (item: Open5eItem): item is Open5eMagicItem {
  return 'is_magic_item' in item && 'rarity' in item
}

export function isWeapon(item: Open5eItem): item is Open5eWeapon {
  return 'damage_type' in item && 'is_simple' in item
}

export function isArmor(item: Open5eItem): item is Open5eArmor {
  return 'ac_display' in item
}

export function isCondition(item: Open5eItem): item is Open5eCondition {
  return 'has_levels' in item && 'level' in item
}

export function isSection(item: Open5eItem): item is Open5eSection {
  return 'content' in item && 'section_type' in item
}
