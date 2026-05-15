import {
  open5eV2ArmorFixture,
  open5eV2ConditionFixture,
  open5eV2MagicItemFixture,
  open5eV2MonsterFixture,
  open5eV2SpellFixture,
  open5eV2WeaponFixture,
} from './v2'

export const dndSpellFixture: DndSpell = toSpell(open5eV2SpellFixture)
export const dndWeaponFixture: DndWeapon = toWeapon(open5eV2WeaponFixture)
export const dndArmorFixture: DndArmor = toArmor(open5eV2ArmorFixture)
export const dndMagicItemFixture: DndMagicItem = toMagicItem(open5eV2MagicItemFixture)
export const dndMonsterFixture: DndMonster = toMonster(open5eV2MonsterFixture)
export const dndConditionFixture: DndCondition = toCondition(open5eV2ConditionFixture)
