import { initiativeKeys } from '~~/constants/dnd-rules'
import { firstName, lastName, middleName } from '~~/constants/names.json'

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

const VALID_DICE_SIDES: DiceSide[] = [4, 6, 8, 10, 12, 20, 100]
const MAX_DICE_COUNT = 100

export function validateDiceExpression(diceExpr: string): boolean {
  const dicePattern = /^(\d+)d(\d+)$/
  const match = diceExpr.match(dicePattern)

  if (!match) return false

  const diceCount = parseInt(match[1]!)
  const diceSides = parseInt(match[2]!)

  if (diceCount <= 0 || diceCount > MAX_DICE_COUNT) return false
  if (!VALID_DICE_SIDES.includes(diceSides as DiceSide)) return false

  return true
}

export function parseDamageDice(damageDice?: string): { count: number, sides: number }[] {
  if (!damageDice) return []

  return damageDice
    .split(/[+\s]+/)
    .map(dice => dice.trim())
    .filter(dice => dice.length > 0)
    .filter(validateDiceExpression)
    .map((dice) => {
      const [count, sides] = dice.split('d')
      return { count: parseInt(count!), sides: parseInt(sides!) }
    })
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

export function handleHpChanges(
  amount: number,
  type: HealthType,
  item: InitiativeSheetRow,
  allowNegative: boolean,
): { row: InitiativeSheetRow, toasts: ToastItem[] } {
  const toasts: ToastItem[] = []
  const row = { ...item }
  const noHp = typeof row.health === 'number' && row.health <= 0

  if (type === 'heal') {
    if (hasDeathSaves(row.type) && noHp) row.deathSaves = resetDeathSaves()

    heal('health', row, amount)
  }
  else if (type === 'temp') temp('health', row, amount)
  else if (type === 'override') override('health', row, amount)
  else if (type === 'override-reset') overrideReset('health', row, amount)
  else if (type === 'damage') {
    damage('health', row, amount)

    const downed = typeof row.health === 'number' && row.health <= 0

    // When the creature has 0hp and get damage, add 2 death save failures
    if (hasDeathSaves(row.type) && noHp) {
      if (!row.deathSaves) {
        row.deathSaves = {
          fail: [false, false, false],
          save: [false, false, false],
        }
      }

      row.deathSaves = addDeathSave(row.deathSaves, 'fail', 2)
    }

    if (row.concentration && !downed) {
      toasts.push({
        title: ['components.initiativeTable.concentration.title'],
        description: ['components.initiativeTable.concentration.text', { name: row.name }],
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
  const dead = (row.health && row.maxHealth && row.health < 0 && Math.abs(row.health) >= row.maxHealth)
  const { failed, saved } = row.deathSaves ? checkDeathSaves(row.deathSaves) : { failed: false, saved: false }

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

  // when health is an negative number change it to 0
  if (!allowNegative && row.health && row.health < 0) row.health = 0

  return { row, toasts }
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
