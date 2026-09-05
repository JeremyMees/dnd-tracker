import { toSpell } from './spell'
import { toMonster } from './monster'
import { toCondition } from './condition'
import { toMagicItem } from './magic-item'
import { toWeapon } from './weapon'
import { toArmor } from './armor'
import {
  isArmor,
  isCondition,
  isMagicItem,
  isMonster,
  isSpell,
  isWeapon,
} from '../dnd/checks'
export function transformOpen5eItem(
  type: Open5eType,
  item: Open5eItem,
): DndItem {
  switch (type) {
    case 'spells':
      return toSpell(item as Open5eSpell)
    case 'monsters':
      return toMonster(item as Open5eMonster)
    case 'conditions':
      return toCondition(item as Open5eCondition)
    case 'magicitems':
      return toMagicItem(item as Open5eMagicItem)
    case 'weapons':
      return toWeapon(item as Open5eWeapon)
    case 'armor':
      return toArmor(item as Open5eArmor)
    default:
      throw new Error(`Unsupported open5e type: ${type}`)
  }
}

export function narrowListing(
  type: Open5eType,
  items: DndItem[],
  pages: number,
): Open5eListingResult {
  switch (type) {
    case 'spells':
      return { type, items: items.filter(isSpell), pages }
    case 'monsters':
      return { type, items: items.filter(isMonster), pages }
    case 'conditions':
      return { type, items: items.filter(isCondition), pages }
    case 'magicitems':
      return { type, items: items.filter(isMagicItem), pages }
    case 'weapons':
      return { type, items: items.filter(isWeapon), pages }
    case 'armor':
      return { type, items: items.filter(isArmor), pages }
    default:
      throw new Error(`Unsupported open5e type: ${type}`)
  }
}
