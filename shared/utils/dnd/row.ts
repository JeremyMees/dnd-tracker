export function indexCorrect(rows: InitiativeSheetRow[]): InitiativeSheetRow[] {
  const sortedObjects = [...rows]

  // Sort the array based on the initiative value in descending order
  sortedObjects.sort((a, b) => {
    if (a.initiative == null && b.initiative == null) return 0
    if (a.initiative == null) return 1
    if (b.initiative == null) return -1
    return b.initiative - a.initiative
  })

  return sortedObjects.map((obj, index) => ({ ...obj, index }))
}

function goesBefore(
  row: InitiativeSheetRow,
  other: InitiativeSheetRow,
): boolean {
  if (row.initiative !== other.initiative) {
    return (row.initiative ?? -1) > (other.initiative ?? -1)
  }

  if ((row.initiative ?? -1) < 0) return false

  const modifier = row.initiativeModifier ?? 0
  const otherModifier = other.initiativeModifier ?? 0

  if (modifier !== otherModifier) return modifier > otherModifier

  return row.type === 'player' && other.type !== 'player'
}

export function placeByInitiative(
  rows: InitiativeSheetRow[],
  ids: string[],
): InitiativeSheetRow[] {
  const placed = rows.filter(row => !ids.includes(row.id))

  for (const row of rows.filter(row => ids.includes(row.id))) {
    const position = placed.findIndex(other => goesBefore(row, other))

    placed.splice(position === -1 ? placed.length : position, 0, row)
  }

  return placed
}

export function getCurrentRowIndex(sheet: InitiativeSheet, id: string): number {
  return sheet.rows.findIndex(row => row.id === id)
}

const INTEGER_ROW_FIELDS = [
  'index',
  'initiative',
  'initiativeModifier',
  'armorClass',
  'maxArmorClass',
  'maxArmorClassOld',
  'tempArmorClass',
  'hitPoints',
  'maxHitPoints',
  'maxHitPointsOld',
  'tempHitPoints',
  'proficiencyBonus',
  'passivePerception',
] as const satisfies readonly (keyof InitiativeSheetRow)[]

export function sanitizeRowNumbers(
  row: InitiativeSheetRow,
): InitiativeSheetRow {
  const sanitized = { ...row }

  for (const field of INTEGER_ROW_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = toIntegerOrUndefined(sanitized[field]) as never
    }
  }

  return sanitized
}

function sanitizeDuration(
  duration: DndConditionDuration,
): DndConditionDuration {
  const rounds = toIntegerOrUndefined(duration.rounds)
  const dc = toIntegerOrUndefined(duration.save?.dc)

  return {
    rowId: duration.rowId,
    timing: duration.timing,
    ...(rounds !== undefined && { rounds }),
    ...(duration.save &&
      dc !== undefined && { save: { ability: duration.save.ability, dc } }),
  }
}

export function sanitizeCondition(condition: DndCondition): DndCondition {
  const level = toIntegerOrUndefined(condition.level)

  return {
    id: condition.id,
    name: condition.name,
    desc: condition.desc ?? '',
    ...(level !== undefined && { level }),
    ...(typeof condition.hasLevels === 'boolean' && {
      hasLevels: condition.hasLevels,
    }),
    ...(condition.duration && {
      duration: sanitizeDuration(condition.duration),
    }),
  }
}

const COMBAT_PATCH_FIELDS = [
  'hitPoints',
  'maxHitPoints',
  'maxHitPointsOld',
  'tempHitPoints',
  'armorClass',
  'maxArmorClass',
  'maxArmorClassOld',
  'tempArmorClass',
  'conditions',
  'deathSaves',
  'concentration',
] as const satisfies readonly (keyof InitiativeSheetRow)[]

export function buildCombatPatch(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): Partial<InitiativeSheetRow> {
  const patch: Partial<InitiativeSheetRow> = {}

  for (const field of COMBAT_PATCH_FIELDS) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      patch[field] = after[field] as never
    }
  }

  return patch
}

export const createInitiativeRow = (
  formData: Partial<InitiativeSheetRow> & { name: string },
  type: HomebrewType,
  encounterRows: number,
): InitiativeSheetRow => {
  const initiative =
    'initiative' in formData ? Number(formData.initiative ?? -1) : -1
  const initiativeModifier =
    'initiativeModifier' in formData
      ? Number(formData.initiativeModifier)
      : undefined
  const hp = getHP(formData)
  const ac = getAC(formData)
  const baseArray: [boolean, boolean, boolean] = [false, false, false]

  return {
    ...formData,
    id: crypto.randomUUID(),
    index: encounterRows + 1,
    conditions: [],
    type,
    initiative,
    initiativeModifier,
    note: '',
    hitPoints: hp,
    armorClass: ac,
    maxHitPoints: hp,
    maxArmorClass: ac,
    tempHitPoints: 0,
    tempArmorClass: 0,
    concentration: false,
    deathSaves: { save: baseArray, fail: baseArray },
  }
}

export function appendRows(
  rows: InitiativeSheetRow[],
  added: (Partial<InitiativeSheetRow> & { name: string; type: HomebrewType })[],
): InitiativeSheetRow[] {
  const created = added.map((row, i) =>
    createInitiativeRow(row, row.type, rows.length + i),
  )

  return indexCorrect(
    placeByInitiative(
      [...rows, ...created],
      created.map(row => row.id),
    ),
  )
}

export const monsterToRow = (
  monster: DndMonster,
): Partial<InitiativeSheetRow> & { name: string; type: HomebrewType } => {
  const {
    initiativeBonus,
    hitDice,
    languages,
    proficiencyBonus,
    type: _type,
    size: _size,
    alignment: _alignment,
    experiencePoints: _experiencePoints,
    ...rest
  } = monster

  return {
    ...rest,
    type: 'monster',
    hitDice: parseDndDiceToString(hitDice),
    languages: parseDndLanguages(languages),
    initiativeModifier: initiativeBonus,
    proficiencyBonus: proficiencyBonus ?? undefined,
  }
}

export const homebrewToRow = (
  homebrew: HomebrewItemRow,
): Partial<InitiativeSheetRow> & { name: string; type: HomebrewType } => {
  const { id, initiativeModifier, ...rest } = homebrew

  return {
    ...nullsToUndefined(rest),
    homebrew: id,
    initiativeModifier: toIntegerOrUndefined(initiativeModifier),
  }
}

export function toSummoner(
  rows: InitiativeSheetRow[],
  id?: string,
): InitiativeSheetRow['summoner'] {
  const summoner = id ? rows.find(row => row.id === id) : undefined

  return summoner ? { name: summoner.name, id: summoner.id } : undefined
}

export function replaceRow(
  rows: InitiativeSheetRow[],
  replacement: InitiativeSheetRow,
): InitiativeSheetRow[] {
  return rows.map(row => (row.id === replacement.id ? replacement : row))
}

export const editInitiativeRow = (
  row: InitiativeSheetRow,
  formData: Partial<InitiativeSheetRow> & { name: string },
  type: HomebrewType,
): InitiativeSheetRow => {
  const { hitPoints: _hitPoints, armorClass: _armorClass, ...stats } = formData
  const hp = getHP(formData)
  const ac = getAC(formData)
  const baseHp = getBaseHP(row)
  const baseAc = getBaseAC(row)

  return {
    ...row,
    ...stats,
    type,
    ...(hp === baseHp
      ? {}
      : { hitPoints: hp, maxHitPoints: hp, maxHitPointsOld: undefined }),
    ...(ac === baseAc
      ? {}
      : { armorClass: ac, maxArmorClass: ac, maxArmorClassOld: undefined }),
  }
}
