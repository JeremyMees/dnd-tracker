import { checkDeathSaves } from './death-saves'

function countNewlyTrue(before: boolean[], after: boolean[]): number {
  return after.filter((value, index) => value && !before[index]).length
}

export function diffFlags(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const payload = { rowName: after.name }
  const events: CombatEventDraft[] = []

  if (!before.readied && after.readied) {
    events.push({ type: 'readied', payload })
  } else if (before.readied && after.readied === false) {
    events.push({ type: 'ready_used', payload })
  }

  if (!before.hidden && after.hidden) {
    events.push({ type: 'hidden', payload })
  } else if (before.hidden && after.hidden === false) {
    events.push({ type: 'revealed', payload })
  }

  return events
}

function changeKind<T extends string>(
  overridden: boolean,
  delta: number,
  gain: T,
  loss: T,
): T | 'override' {
  if (overridden) return 'override'

  return delta > 0 ? gain : loss
}

function diffHitPoints(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const rowName = after.name

  if (after.hitPoints !== before.hitPoints) {
    const delta = (after.hitPoints ?? 0) - (before.hitPoints ?? 0)
    const overridden = after.maxHitPoints !== before.maxHitPoints

    return [
      {
        type: 'hp',
        payload: {
          rowName,
          kind: changeKind(overridden, delta, 'heal', 'damage'),
          amount: Math.abs(delta),
          before: before.hitPoints,
          after: after.hitPoints,
        },
      },
    ]
  }

  if (after.tempHitPoints !== before.tempHitPoints) {
    return [
      {
        type: 'hp',
        payload: {
          rowName,
          kind: 'temp',
          amount: after.tempHitPoints,
          before: before.tempHitPoints,
          after: after.tempHitPoints,
        },
      },
    ]
  }

  return []
}

function diffArmorClass(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const rowName = after.name

  if (after.armorClass !== before.armorClass) {
    const delta = (after.armorClass ?? 0) - (before.armorClass ?? 0)
    const overridden = after.maxArmorClass !== before.maxArmorClass

    return [
      {
        type: 'ac',
        payload: {
          rowName,
          kind: changeKind(overridden, delta, 'add', 'remove'),
          amount: Math.abs(delta),
          before: before.armorClass,
          after: after.armorClass,
        },
      },
    ]
  }

  if (after.tempArmorClass !== before.tempArmorClass) {
    return [
      {
        type: 'ac',
        payload: {
          rowName,
          kind: 'temp',
          amount: after.tempArmorClass,
          before: before.tempArmorClass,
          after: after.tempArmorClass,
        },
      },
    ]
  }

  return []
}

function diffConditions(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const rowName = after.name
  const beforeConditionIds = new Set(before.conditions.map(c => c.id))
  const afterConditionIds = new Set(after.conditions.map(c => c.id))

  const added = after.conditions
    .filter(condition => !beforeConditionIds.has(condition.id))
    .map((condition): CombatEventDraft => ({
      type: 'condition_added',
      payload: {
        rowName,
        condition: { id: condition.id, name: condition.name },
      },
    }))

  const removed = before.conditions
    .filter(condition => !afterConditionIds.has(condition.id))
    .map((condition): CombatEventDraft => ({
      type: 'condition_removed',
      payload: {
        rowName,
        condition: { id: condition.id, name: condition.name },
      },
    }))

  return [...added, ...removed]
}

function diffConcentration(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const payload = { rowName: after.name }

  if (before.concentration === true && after.concentration === false) {
    return [{ type: 'concentration_broken', payload }]
  }

  if (before.concentration === false && after.concentration === true) {
    return [{ type: 'concentration_started', payload }]
  }

  return []
}

function diffDeathSaves(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  if (!before.deathSaves || !after.deathSaves) return []

  const rowName = after.name
  const events: CombatEventDraft[] = []
  const addedFails = countNewlyTrue(
    before.deathSaves.fail,
    after.deathSaves.fail,
  )
  const addedSaves = countNewlyTrue(
    before.deathSaves.save,
    after.deathSaves.save,
  )

  if (addedFails > 0) {
    events.push({
      type: 'death_save',
      payload: { rowName, result: 'fail', amount: addedFails },
    })
  }

  if (addedSaves > 0) {
    events.push({
      type: 'death_save',
      payload: { rowName, result: 'save', amount: addedSaves },
    })
  }

  const beforeStatus = checkDeathSaves(before.deathSaves)
  const afterStatus = checkDeathSaves(after.deathSaves)

  if (afterStatus.saved && !afterStatus.failed && !beforeStatus.saved) {
    events.push({ type: 'stabilized', payload: { rowName } })
  }

  if (afterStatus.failed && !afterStatus.saved && !beforeStatus.failed) {
    events.push({ type: 'died', payload: { rowName } })
  }

  return events
}

export function diffRow(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  return [
    ...diffHitPoints(before, after),
    ...diffArmorClass(before, after),
    ...diffConditions(before, after),
    ...diffConcentration(before, after),
    ...diffDeathSaves(before, after),
    ...diffFlags(before, after),
  ]
}

const LOG_ONLY_EVENTS = new Set<string>([
  'turn',
  'row_added',
  'row_removed',
  'roll',
  'readied',
  'ready_used',
  'ready_expired',
  'hidden',
  'revealed',
])

export function isStatEvent(event: { type: string }): boolean {
  return !LOG_ONLY_EVENTS.has(event.type)
}

export function turnEvent(
  rows: InitiativeSheetRow[],
  activeIndex: number,
): CombatEventDraft | undefined {
  const row = rows[activeIndex]

  if (!row) return undefined

  return { type: 'turn', rowId: row.id, payload: { rowName: row.name } }
}

export function diffSheet(
  before: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'>,
  after: Partial<Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'>>,
): CombatEventDraft[] {
  const rows = after.rows ?? before.rows
  const beforeIds = new Set(before.rows.map(row => row.id))
  const afterIds = new Set(rows.map(row => row.id))

  const added = rows
    .filter(row => !beforeIds.has(row.id))
    .map((row): CombatEventDraft => ({
      type: 'row_added',
      rowId: row.id,
      payload: {
        rowName: row.name,
        initiative:
          row.initiative !== undefined && row.initiative >= 0
            ? row.initiative
            : undefined,
      },
    }))

  const removed = before.rows
    .filter(row => !afterIds.has(row.id))
    .map((row): CombatEventDraft => ({
      type: 'row_removed',
      rowId: row.id,
      payload: { rowName: row.name },
    }))

  const beforeById = new Map(before.rows.map(row => [row.id, row]))
  const flags = rows.flatMap(row => {
    const previous = beforeById.get(row.id)

    return previous
      ? diffFlags(previous, row).map(event => ({ ...event, rowId: row.id }))
      : []
  })

  const activeIndex = after.activeIndex ?? before.activeIndex
  const turnChanged =
    activeIndex !== before.activeIndex ||
    (after.round ?? before.round) !== before.round
  const turn = turnChanged ? turnEvent(rows, activeIndex) : undefined

  return [...removed, ...added, ...flags, ...(turn ? [turn] : [])]
}
