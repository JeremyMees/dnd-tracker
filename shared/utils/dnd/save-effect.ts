import { damageTypes } from '~~/constants/dnd'

const DC = /\bDC\s*(\d+)/i
const ABILITY =
  /\b(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+saving throw/i
const DAMAGE = /\((\d+d\d+)(?:\s*([+-])\s*(\d+))?\)\s*([a-z]+)?\s*damage/i
const HALF = /half (?:as much )?damage/i
const ATTACK_ROLL = /attack roll|weapon attack|spell attack/i

function toDamageType(value?: string): DndDamageType | undefined {
  const type = value?.toLowerCase()

  return damageTypes.find(damageType => damageType === type)
}

export function parseSaveEffect(desc: string): DndSaveEffect | undefined {
  if (ATTACK_ROLL.test(desc)) return undefined

  const dc = desc.match(DC)
  const ability = desc.match(ABILITY)

  if (!dc || !ability) return undefined

  const damage = desc.slice(ability.index).match(DAMAGE)

  if (!damage) return undefined

  const [, dice, sign, bonus, type] = damage

  return {
    dc: Number(dc[1]),
    ability: ability[1]!.toLowerCase() as DndAbility,
    dice: dice!,
    bonus: bonus ? Number(bonus) * (sign === '-' ? -1 : 1) : 0,
    damageType: toDamageType(type),
    halfOnSuccess: HALF.test(desc),
  }
}

export function attackSaveEffect(attack: DndAttack): DndSaveEffect | undefined {
  const dice = formatAttackDamage(attack)

  if (!attack.spellSave || !attack.spellSaveType || !dice) return undefined

  return {
    dc: attack.spellSave,
    ability: attack.spellSaveType,
    dice,
    bonus: (attack.damageBonus ?? 0) + (attack.extraDamageBonus ?? 0),
    damageType: attack.damageType,
    halfOnSuccess: true,
  }
}

export function actionSaveEffect(
  action: Pick<DndAction, 'desc' | 'attacks'>,
): DndSaveEffect | undefined {
  for (const attack of action.attacks) {
    const effect = attackSaveEffect(attack)

    if (effect) return effect
  }

  return parseSaveEffect(action.desc)
}

export function rollSaveEffectDamage(
  effect: Pick<DndSaveEffect, 'dice' | 'bonus'>,
  roll: (sides: number) => number = randomRoll,
): number {
  const rolled = parseDamageDice(effect.dice).reduce((total, dice) => {
    let sum = total

    for (let i = 0; i < dice.count; i++) sum += roll(dice.sides)

    return sum
  }, 0)

  return Math.max(0, rolled + effect.bonus)
}
