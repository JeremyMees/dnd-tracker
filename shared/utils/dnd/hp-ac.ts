import { bloodiedConditionId } from '~~/constants/dnd'

type ModifierType = 'hitPoints' | 'armorClass'

function heal(
  type: ModifierType,
  row: InitiativeSheetRow,
  amount: number,
): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'

  if (typeof row[type] === 'number' && typeof row[max] === 'number') {
    if (row[type] + amount > row[max]) row[type] = row[max]
    else row[type] = row[type] + amount
  }
}

function damage(
  type: ModifierType,
  row: InitiativeSheetRow,
  amount: number,
): void {
  const temp = type === 'hitPoints' ? 'tempHitPoints' : 'tempArmorClass'

  if (typeof row[temp] === 'number') {
    if (row[temp] >= amount) row[temp] = row[temp] - amount
    else if (row[type]) {
      row[type] = row[type] - (amount - row[temp])
      row[temp] = 0
    }
  } else if (row[type]) row[type] = row[type] - amount
}

function temp(
  type: ModifierType,
  row: InitiativeSheetRow,
  amount: number,
): void {
  const temp = type === 'hitPoints' ? 'tempHitPoints' : 'tempArmorClass'

  if (row[type] && row[type] > 0) row[temp] = amount
}

function override(
  type: ModifierType,
  row: InitiativeSheetRow,
  amount: number,
): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'
  const old = type === 'hitPoints' ? 'maxHitPointsOld' : 'maxArmorClassOld'

  if (row[type] && row[max]) {
    row[type] = amount < row[max] ? amount : amount - (row[max] - row[type])
  } else row[type] = amount

  row[old] = row[max] || amount
  row[max] = amount
}

function overrideReset(
  type: ModifierType,
  row: InitiativeSheetRow,
  amount: number,
): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'
  const old = type === 'hitPoints' ? 'maxHitPointsOld' : 'maxArmorClassOld'

  if (row[type] && row[max] && row[old]) {
    row[type] =
      row[old] < row[max] ? row[old] : row[old] - (row[max] - row[type])
  }

  row[old] = undefined
  row[max] = amount
}

export const hpFunctions = {
  heal: (row: InitiativeSheetRow, amount: number) =>
    heal('hitPoints', row, amount),
  damage: (row: InitiativeSheetRow, amount: number) =>
    damage('hitPoints', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) =>
    temp('hitPoints', row, amount),
  override: (row: InitiativeSheetRow, amount: number) =>
    override('hitPoints', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) =>
    overrideReset('hitPoints', row, amount),
}

export const acFunctions = {
  add: (row: InitiativeSheetRow, amount: number) =>
    heal('armorClass', row, amount),
  remove: (row: InitiativeSheetRow, amount: number) =>
    damage('armorClass', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) =>
    temp('armorClass', row, amount),
  override: (row: InitiativeSheetRow, amount: number) =>
    override('armorClass', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) =>
    overrideReset('armorClass', row, amount),
}

export function handleAcChanges(
  amount: number,
  type: DndAcType,
  item: InitiativeSheetRow,
  allowNegative: boolean,
): InitiativeSheetRow {
  const row = { ...item }

  if (type === 'add') acFunctions.add(row, amount)
  else if (type === 'remove') acFunctions.remove(row, amount)
  else if (type === 'temp') acFunctions.temp(row, amount)
  else if (type === 'override') acFunctions.override(row, amount)
  else if (type === 'override-reset') acFunctions.overrideReset(row, amount)

  if (!allowNegative && row.armorClass && row.armorClass < 0) row.armorClass = 0

  return row
}

export function hasNoHitPoints(row: InitiativeSheetRow): boolean {
  return typeof row.hitPoints === 'number' && row.hitPoints <= 0
}

export function isInstantDeath(
  row: InitiativeSheetRow,
  amount: number,
): boolean {
  if (!hasDeathSaves(row.type)) return false
  if (typeof row.hitPoints !== 'number') return false
  if (typeof row.maxHitPoints !== 'number') return false

  const leftover =
    amount - (row.tempHitPoints ?? 0) - Math.max(row.hitPoints, 0)

  return leftover >= row.maxHitPoints
}

export function healHitPoints(row: InitiativeSheetRow, amount: number): void {
  if (hasDeathSaves(row.type) && hasNoHitPoints(row)) {
    row.deathSaves = resetDeathSaves()
  }

  heal('hitPoints', row, amount)
}

export function damageHitPoints(
  row: InitiativeSheetRow,
  amount: number,
  { critical, instantDeath }: { critical: boolean; instantDeath: boolean },
): ToastItem[] {
  const toasts: ToastItem[] = []
  const noHp = hasNoHitPoints(row)

  damage('hitPoints', row, amount)

  const downed = hasNoHitPoints(row)

  // When the creature has 0hp and get damage, add 1 death save failure (2 on a critical hit)
  if (hasDeathSaves(row.type) && noHp) {
    row.deathSaves = applyDeathSave(
      row.deathSaves ?? {
        fail: [false, false, false],
        save: [false, false, false],
      },
      'fail',
      critical ? 2 : 1,
    )
  }

  if (instantDeath) {
    row.deathSaves = {
      fail: [true, true, true],
      save: [false, false, false],
    }
  }

  if (row.concentration && !downed) {
    toasts.push({
      title: ['components.initiativeTable.concentration.title'],
      description: [
        'components.initiativeTable.concentration.text',
        { name: row.name, dc: concentrationDC(amount) },
      ],
      variant: 'info',
    })
  }

  const lasting = row.conditions.filter(condition => condition.hasLevels)

  if (downed && (row.concentration || row.conditions.length > lasting.length)) {
    row.concentration = false
    row.conditions = lasting

    toasts.push({
      title: ['components.initiativeTable.downed.title', { name: row.name }],
      description: [
        'components.initiativeTable.downed.text',
        { name: row.name },
      ],
      variant: 'info',
    })
  }

  return toasts
}

export function deathSaveToasts(
  row: InitiativeSheetRow,
  { wasDead, instantDeath }: { wasDead: boolean; instantDeath: boolean },
): ToastItem[] {
  if (!row.deathSaves) return []

  const { failed, saved } = checkDeathSaves(row.deathSaves)

  if (failed && !saved && !wasDead) {
    return [
      {
        title: ['components.initiativeTable.died.title', { name: row.name }],
        description: [
          instantDeath
            ? 'components.initiativeTable.died.textMassiveDamage'
            : 'components.initiativeTable.died.textDeathSaves',
          { name: row.name },
        ],
        variant: 'info',
      },
    ]
  }

  if (!failed && saved) {
    return [
      {
        title: ['components.initiativeTable.stable.title', { name: row.name }],
        description: [
          'components.initiativeTable.stable.textDeathSaves',
          { name: row.name },
        ],
        variant: 'info',
      },
    ]
  }

  return []
}

export function handleHpChanges(
  amount: number,
  type: DndHpType,
  item: InitiativeSheetRow,
  allowNegative: boolean,
  { critical = false }: { critical?: boolean } = {},
): { row: InitiativeSheetRow; toasts: ToastItem[] } {
  const toasts: ToastItem[] = []
  const row = { ...item }
  const instantDeath = type === 'damage' && isInstantDeath(row, amount)
  const wasDead = !!row.deathSaves && checkDeathSaves(row.deathSaves).failed

  if (type === 'heal') healHitPoints(row, amount)
  else if (type === 'temp') temp('hitPoints', row, amount)
  else if (type === 'override') override('hitPoints', row, amount)
  else if (type === 'override-reset') overrideReset('hitPoints', row, amount)
  else if (type === 'damage') {
    toasts.push(...damageHitPoints(row, amount, { critical, instantDeath }))
  }

  toasts.push(...deathSaveToasts(row, { wasDead, instantDeath }))

  // when hitPoints is a negative number change it to 0
  if (!allowNegative && row.hitPoints && row.hitPoints < 0) row.hitPoints = 0

  return { row, toasts }
}

export function getHP(
  item: DndMonster | (Partial<InitiativeSheetRow> & { name: string }),
): number | undefined {
  return isDefined(item.hitPoints) ? parseNumber(item.hitPoints) : undefined
}

export function getAC(
  item: DndMonster | (Partial<InitiativeSheetRow> & { name: string }),
): number | undefined {
  return isDefined(item.armorClass) ? parseNumber(item.armorClass) : undefined
}

export function getBaseHP(
  row: Pick<InitiativeSheetRow, 'maxHitPoints' | 'maxHitPointsOld'>,
): number | undefined {
  return row.maxHitPointsOld ?? row.maxHitPoints
}

export function getBaseAC(
  row: Pick<InitiativeSheetRow, 'maxArmorClass' | 'maxArmorClassOld'>,
): number | undefined {
  return row.maxArmorClassOld ?? row.maxArmorClass
}

export function withBaseStats<T extends InitiativeSheetRow>(row: T) {
  return { ...row, hitPoints: getBaseHP(row), armorClass: getBaseAC(row) }
}

export function getHealthBand(hitPoints = 0, maxHitPoints = 0): DndHealthBand {
  if (maxHitPoints <= 0) return hitPoints > 0 ? 'healthy' : 'critical'

  const ratio = hitPoints / maxHitPoints

  if (ratio <= 0.25) return 'critical'
  if (ratio <= 0.5) return 'bloodied'
  return 'healthy'
}

export function isBloodied(hitPoints?: number, maxHitPoints?: number): boolean {
  if (!hitPoints || !maxHitPoints) return false

  return hitPoints > 0 && hitPoints <= maxHitPoints / 2
}

export function isAutoRollInitiativeEnabled(
  settings?: InitiativeSettings,
): boolean {
  return settings?.autoRollInitiative !== false
}

export function isSkipDeadMonstersEnabled(
  settings?: InitiativeSettings | null,
): boolean {
  return settings?.skipDeadMonsters !== false
}

export function isBloodiedEnabled(
  settings?: Pick<InitiativeSettings, 'bloodied'>,
): boolean {
  return settings?.bloodied !== false
}

export function withBloodied(
  row: InitiativeSheetRow,
  bloodied?: DndCondition,
): InitiativeSheetRow {
  if (!bloodied) return row

  const applied = row.conditions.some(({ id }) => id === bloodied.id)
  const bloodiedNow = isBloodied(row.hitPoints, row.maxHitPoints)

  if (bloodiedNow && !applied) {
    return {
      ...row,
      conditions: [...row.conditions, sanitizeCondition(bloodied)],
    }
  }

  if (!bloodiedNow && applied) {
    return {
      ...row,
      conditions: row.conditions.filter(({ id }) => id !== bloodied.id),
    }
  }

  return row
}

export function withoutBloodied(conditions: DndCondition[]): DndCondition[] {
  return conditions.filter(({ id }) => id !== bloodiedConditionId)
}
