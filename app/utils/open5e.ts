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

export function isMonster(item: Open5eItem): item is Open5eMonster {
  return 'experience_points' in item && 'challenge_rating_decimal' in item
}

export function splitActionsByType(actions: Open5eAction[]): Record<Open5eActionType, Open5eAction[]> {
  return actions.reduce((acc, action) => {
    const type = action.action_type as Open5eActionType

    acc[type] ??= []
    acc[type].push(action)

    return acc
  }, {} as Record<Open5eActionType, Open5eAction[]>)
}

const actionTypeMap: Record<Open5eActionType, ActionType> = {
  ACTION: 'actions',
  BONUS_ACTION: 'bonus_actions',
  REACTION: 'reactions',
  LEGENDARY_ACTION: 'legendary_actions',
  MYTHIC_ACTION: 'mythic_actions',
  LAIR_ACTION: 'lair_actions',
}

export function mapOpen5eActionToAction(open5eAction: Open5eAction): Action {
  const firstAttack = open5eAction.attacks?.[0]

  const damageDice = firstAttack?.damage_die_count && firstAttack?.damage_die_type
    ? `${firstAttack.damage_die_count}${firstAttack.damage_die_type.toLowerCase()}`
    : undefined

  return {
    name: open5eAction.name,
    desc: open5eAction.desc,
    type: actionTypeMap[open5eAction.action_type] ?? 'actions',
    ...(firstAttack?.to_hit_mod ? { attack_bonus: firstAttack.to_hit_mod } : {}),
    ...(firstAttack?.damage_bonus ? { damage_bonus: firstAttack.damage_bonus } : {}),
    ...(damageDice ? { damage_dice: damageDice } : {}),
  }
}

interface MappedMonsterActions {
  actions: Action[]
  bonus_actions: Action[]
  reactions: Action[]
  legendary_actions: Action[]
  mythic_actions: Action[]
  lair_actions: Action[]
  special_abilities: Action[]
}

export function mapOpen5eMonsterActions(monster: Open5eMonster): MappedMonsterActions {
  const result: MappedMonsterActions = {
    actions: [],
    bonus_actions: [],
    reactions: [],
    legendary_actions: [],
    mythic_actions: [],
    lair_actions: [],
    special_abilities: [],
  }

  if (monster.traits?.length) {
    result.special_abilities = monster.traits.map(trait => ({
      name: trait.name,
      desc: trait.desc,
      type: 'special_abilities' as ActionType,
    }))
  }

  if (monster.actions?.length) {
    for (const action of monster.actions) {
      const mapped = mapOpen5eActionToAction(action)
      const targetKey: ActionType = actionTypeMap[action.action_type] ?? 'actions'

      if (targetKey in result) result[targetKey].push(mapped)
    }
  }

  return result
}
