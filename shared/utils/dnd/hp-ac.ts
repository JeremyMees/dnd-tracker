type ModifierType = 'hitPoints' | 'armorClass'

function heal(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'

  if (typeof row[type] === 'number' && typeof row[max] === 'number') {
    if (row[type] + amount > row[max]) row[type] = row[max]
    else row[type] = row[type] + amount
  }
}

function damage(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const temp = type === 'hitPoints' ? 'tempHitPoints' : 'tempArmorClass'

  if (typeof row[temp] === 'number') {
    if (row[temp] >= amount) row[temp] = row[temp] - amount
    else if (row[type]) {
      row[type] = row[type] - (amount - row[temp])
      row[temp] = 0
    }
  }
  else if (row[type]) row[type] = row[type] - amount
}

function temp(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const temp = type === 'hitPoints' ? 'tempHitPoints' : 'tempArmorClass'

  if (row[type] && row[type] > 0) row[temp] = amount
}

function override(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'
  const old = type === 'hitPoints' ? 'maxHitPointsOld' : 'maxArmorClassOld'

  if (row[type] && row[max]) {
    row[type] = amount < row[max]
      ? amount
      : amount - (row[max] - row[type])
  }
  else row[type] = amount

  row[old] = row[max] || amount
  row[max] = amount
}

function overrideReset(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const max = type === 'hitPoints' ? 'maxHitPoints' : 'maxArmorClass'
  const old = type === 'hitPoints' ? 'maxHitPointsOld' : 'maxArmorClassOld'

  if (row[type] && row[max] && row[old]) {
    row[type] = row[old] < row[max]
      ? row[old]
      : row[old] - (row[max] - row[type])
  }

  row[old] = undefined
  row[max] = amount
}

export const hpFunctions = {
  heal: (row: InitiativeSheetRow, amount: number) => heal('hitPoints', row, amount),
  damage: (row: InitiativeSheetRow, amount: number) => damage('hitPoints', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) => temp('hitPoints', row, amount),
  override: (row: InitiativeSheetRow, amount: number) => override('hitPoints', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) => overrideReset('hitPoints', row, amount),
}

export const acFunctions = {
  add: (row: InitiativeSheetRow, amount: number) => heal('armorClass', row, amount),
  remove: (row: InitiativeSheetRow, amount: number) => damage('armorClass', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) => temp('armorClass', row, amount),
  override: (row: InitiativeSheetRow, amount: number) => override('armorClass', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) => overrideReset('armorClass', row, amount),
}

export function handleHpChanges(
  amount: number,
  type: DndHpType,
  item: InitiativeSheetRow,
  allowNegative: boolean,
): { row: InitiativeSheetRow, toasts: ToastItem[] } {
  const toasts: ToastItem[] = []
  const row = { ...item }
  const noHp = typeof row.hitPoints === 'number' && row.hitPoints <= 0

  if (type === 'heal') {
    if (hasDeathSaves(row.type) && noHp) row.deathSaves = resetDeathSaves()

    heal('hitPoints', row, amount)
  }
  else if (type === 'temp') temp('hitPoints', row, amount)
  else if (type === 'override') override('hitPoints', row, amount)
  else if (type === 'override-reset') overrideReset('hitPoints', row, amount)
  else if (type === 'damage') {
    damage('hitPoints', row, amount)

    const downed = typeof row.hitPoints === 'number' && row.hitPoints <= 0

    // When the creature has 0hp and get damage, add 2 death save failures
    if (hasDeathSaves(row.type) && noHp) {
      if (!row.deathSaves) {
        row.deathSaves = {
          fail: [false, false, false],
          save: [false, false, false],
        }
      }

      row.deathSaves = applyDeathSave(row.deathSaves, 'fail', 2)
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

    if (downed && (row.concentration || row.conditions.length)) {
      row.concentration = false
      row.conditions = []

      toasts.push({
        title: ['components.initiativeTable.downed.title', { name: row.name }],
        description: ['components.initiativeTable.downed.text', { name: row.name }],
        variant: 'info',
      })
    }
  }

  // when user is dies because of going to much in the negative hp
  const dead = (row.hitPoints && row.maxHitPoints && row.hitPoints < 0 && Math.abs(row.hitPoints) >= row.maxHitPoints)
  const { failed, saved } = row.deathSaves
    ? checkDeathSaves(row.deathSaves)
    : { failed: false, saved: false }

  if (dead || (failed && !saved)) {
    toasts.push({
      title: ['components.initiativeTable.died.title', { name: row.name }],
      description: ['components.initiativeTable.died.textMinHP', { name: row.name }],
      variant: 'info',
    })
  }

  if (!failed && saved) {
    toasts.push({
      title: ['components.initiativeTable.stable.title', { name: row.name }],
      description: ['components.initiativeTable.stable.textDeathSaves', { name: row.name }],
      variant: 'info',
    })
  }

  // when hitPoints is a negative number change it to 0
  if (!allowNegative && row.hitPoints && row.hitPoints < 0) row.hitPoints = 0

  return { row, toasts }
}

export function getHP(item: DndMonster | Partial<InitiativeSheetRow> & { name: string }): number | undefined {
  return isDefined(item.hitPoints) ? parseNumber(item.hitPoints) : undefined
}

export function getAC(item: DndMonster | Partial<InitiativeSheetRow> & { name: string }): number | undefined {
  return isDefined(item.armorClass) ? parseNumber(item.armorClass) : undefined
}
