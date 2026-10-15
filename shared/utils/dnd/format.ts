import { abilityTypeMap } from '~~/constants/dnd'

export function formatBonus(val: number): string {
  return val >= 0 ? `+${val}` : `${val}`
}

export function formatRange(attack: DndAttack): string | null {
  const unit = attack.distanceUnit === 'feet' ? 'ft' : 'mi'

  if (attack.reach !== undefined) return `${attack.reach} ${unit}`

  if (attack.range !== undefined) {
    return attack.longRange !== undefined
      ? `${attack.range}/${attack.longRange} ${unit}`
      : `${attack.range} ${unit}`
  }

  return null
}

export function formatUsageLimits(limits: DndUsageLimits): string {
  switch (limits.type) {
    case 'perDay':
      return `${limits.param}/day`
    case 'recharge':
      return `Recharge ${limits.param}-6`
    case 'atWill':
      return 'At will'
    case 'perRest':
      return `${limits.param}/rest`
  }
}

export function formatAbilityShort(ability: DndAbility): string {
  return (
    Object.entries(abilityTypeMap).find(
      ([, value]) => value === ability,
    )?.[0] ?? ability
  )
}
