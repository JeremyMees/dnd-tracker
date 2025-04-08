import { initiativeKeys } from '~/constants/dnd-rules'
import { firstName, lastName, middleName } from '~/constants/names.json'

export function randomName(): string {
  const first = randomArrayItem(firstName)
  const last = randomArrayItem(lastName.prefixes) + randomArrayItem(lastName.suffixes)

  if (Math.random() <= 0.10) {
    return `${first} ${randomArrayItem(middleName)} ${last}`
  }

  return `${first} ${last}`
}

export function randomRoll(max: number): number {
  return Math.floor(Math.random() * max) + 1
}

export function rollDice(dice: number, amount = 1): number[] {
  const rolls: number[] = []

  for (let i = 0; i < amount; i++) {
    rolls.push(randomRoll(+dice))
  }

  return rolls
}

type ModifierType = 'health' | 'ac'

function heal(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const max = type === 'health' ? 'maxHealth' : 'maxAc'

  if (typeof row[type] === 'number' && typeof row[max] === 'number') {
    if (row[type] + amount > row[max]) row[type] = row[max]
    else row[type] = row[type] + amount
  }
}

function damage(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const temp = type === 'health' ? 'tempHealth' : 'tempAc'

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
  const temp = type === 'health' ? 'tempHealth' : 'tempAc'

  if (row[type] && row[type] > 0) row[temp] = amount
}

function override(type: ModifierType, row: InitiativeSheetRow, amount: number): void {
  const max = type === 'health' ? 'maxHealth' : 'maxAc'
  const old = type === 'health' ? 'maxHealthOld' : 'maxAcOld'

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
  const max = type === 'health' ? 'maxHealth' : 'maxAc'
  const old = type === 'health' ? 'maxHealthOld' : 'maxAcOld'

  if (row[type] && row[max] && row[old]) {
    row[type] = row[old] < row[max]
      ? row[old]
      : row[old] - (row[max] - row[type])
  }

  row[old] = undefined
  row[max] = amount
}

export const hpFunctions = {
  heal: (row: InitiativeSheetRow, amount: number) => heal('health', row, amount),
  damage: (row: InitiativeSheetRow, amount: number) => damage('health', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) => temp('health', row, amount),
  override: (row: InitiativeSheetRow, amount: number) => override('health', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) => overrideReset('health', row, amount),
}

export const acFunctions = {
  add: (row: InitiativeSheetRow, amount: number) => heal('ac', row, amount),
  remove: (row: InitiativeSheetRow, amount: number) => damage('ac', row, amount),
  temp: (row: InitiativeSheetRow, amount: number) => temp('ac', row, amount),
  override: (row: InitiativeSheetRow, amount: number) => override('ac', row, amount),
  overrideReset: (row: InitiativeSheetRow, amount: number) => overrideReset('ac', row, amount),
}

function hasDeathSaves(type: HomebrewType): boolean {
  return !['summon', 'lair'].includes(type)
}

function checkDeathSaves(deathSaves: DeathSaves): { failed: boolean, saved: boolean } {
  return {
    failed: deathSaves.fail.every(v => v === true) || false,
    saved: deathSaves.save.every(v => v === true) || false,
  }
}

function addDeathSave(deathSaves: DeathSaves, type: 'fail' | 'save' = 'fail', count: number = 1): DeathSaves {
  const updatedSaves = { ...deathSaves }
  const updated = [...updatedSaves[type]]
  let addedCount = 0

  for (let i = 0; i < updated.length && addedCount < count; i++) {
    if (!updated[i]) {
      updated[i] = true
      addedCount++
    }
  }

  updatedSaves[type] = updated as [boolean, boolean, boolean]
  return updatedSaves
}

function resetDeathSaves(): DeathSaves {
  return {
    fail: [false, false, false],
    save: [false, false, false],
  }
}

export const deathSavesFunctions = {
  hasDeathSaves,
  addDeathSave,
  checkDeathSaves,
  resetDeathSaves,
}

export function indexCorrect(rows: InitiativeSheetRow[]): InitiativeSheetRow[] {
  const sortedObjects = [...rows] // Make shallow copy

  // Sort the array based on the initiative value in descending order
  sortedObjects.sort((a, b) => {
    if (!a.initiative && !b.initiative) return 0
    if (!a.initiative) return 1
    if (!b.initiative) return -1
    return b.initiative - a.initiative
  })

  // Add the index to each object based on their sorted position
  return sortedObjects.map((obj, index) => ({ ...obj, index }))
}

export function getCurrentRowIndex(sheet: InitiativeSheet, id: string): number {
  return sheet.rows.findIndex(row => row.id === id)
}

function castToNumber(value: string | number): number | undefined {
  return isNaN(+value) ? undefined : +value
}

export function getHP(item: Open5eItem | Partial<InitiativeSheetRow> & { name: string }): number | undefined {
  if ('health' in item) {
    return isDefined(item.health) ? castToNumber(item.health) : undefined
  }

  if ('hit_points' in item) {
    return isDefined(item.hit_points) ? castToNumber(item.hit_points) : undefined
  }

  return undefined
}

export function getAC(item: Open5eItem | Partial<InitiativeSheetRow> & { name: string }): number | undefined {
  if ('ac' in item) {
    return isDefined(item.ac) ? castToNumber(item.ac) : undefined
  }

  if ('armor_class' in item) {
    return isDefined(item.armor_class) ? castToNumber(item.armor_class) : undefined
  }

  return undefined
}

export const createInitiativeRow = (
  formData: Open5eItem | Partial<InitiativeSheetRow> & { name: string },
  type: HomebrewType,
  encounterRows: number,
): InitiativeSheetRow => {
  const initiative = 'initiative' in formData ? Number(formData.initiative ?? -1) : -1
  const initiative_modifier = 'initiative_modifier' in formData ? Number(formData.initiative_modifier) : undefined
  const health = getHP(formData)
  const ac = getAC(formData)
  const baseArray: [boolean, boolean, boolean] = [false, false, false]

  const baseRow: Record<string, unknown> = {
    ...formData,
    id: crypto.randomUUID(),
    index: encounterRows + 1,
    conditions: [],
    type,
    initiative,
    initiative_modifier,
    note: '',
    health,
    ac,
    maxHealth: health,
    maxAc: ac,
    tempHealth: 0,
    tempAc: 0,
    concentration: false,
    deathSaves: { save: baseArray, fail: baseArray },
  }

  const allowedKeys = new Set(initiativeKeys)

  return Object.fromEntries(
    Object.entries(baseRow).filter(([key]) => allowedKeys.has(key)),
  ) as unknown as InitiativeSheetRow
}

export function hasMaxCharacters(sheet?: InitiativeSheet): boolean {
  return sheet ? sheet.rows.length >= 50 : false
}
