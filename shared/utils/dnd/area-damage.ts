type SaveRow = Pick<
  InitiativeSheetRow,
  'savingThrows' | 'modifiers' | 'abilityScores'
>

type DefenseRow = Pick<InitiativeSheetRow, 'resistancesAndImmunities'>

export function saveBonus(row: SaveRow, ability: DndAbility): number {
  const score = row.abilityScores?.[ability]

  return (
    row.savingThrows?.[ability] ??
    row.modifiers?.[ability] ??
    (isDefined(score) ? modifierFromScore(score) : 0)
  )
}

export function rollSave(
  row: SaveRow,
  ability: DndAbility,
  roll: (sides: number) => number = randomRoll,
): number {
  return roll(20) + saveBonus(row, ability)
}

export function rollsOwnSave(row: Pick<InitiativeSheetRow, 'type'>): boolean {
  return row.type === 'player'
}

export function damageDefense(
  row: DefenseRow,
  damageType?: DndDamageType,
): DndDamageDefense | undefined {
  const defenses = row.resistancesAndImmunities

  if (!damageType || !defenses) return undefined
  if (defenses.damageImmunities.includes(damageType)) return 'immune'
  if (defenses.damageResistances.includes(damageType)) return 'resistant'
  if (defenses.damageVulnerabilities.includes(damageType)) return 'vulnerable'

  return undefined
}

export function areaDamageAmount(
  amount: number,
  {
    saved,
    halfOnSave,
    defense,
  }: { saved: boolean; halfOnSave: boolean; defense?: DndDamageDefense },
): number {
  const halfAmount = halfOnSave ? Math.floor(amount / 2) : 0

  return applyDefense(saved ? halfAmount : amount, defense)
}

export function applyDefense(
  amount: number,
  defense?: DndDamageDefense,
): number {
  if (defense === 'immune') return 0
  if (defense === 'resistant') return Math.floor(amount / 2)
  if (defense === 'vulnerable') return amount * 2

  return amount
}

export function damageAfterDefenses(
  row: DefenseRow,
  rolls: DndDamageRoll[],
): number {
  return rolls.reduce(
    (total, roll) =>
      total + applyDefense(roll.amount, damageDefense(row, roll.type)),
    0,
  )
}

export function damageDefenses(
  row: DefenseRow,
  rolls: DndDamageRoll[],
): { type: DndDamageType; defense: DndDamageDefense }[] {
  return rolls.flatMap(({ type }) => {
    const defense = damageDefense(row, type)

    return type && defense ? [{ type, defense }] : []
  })
}
