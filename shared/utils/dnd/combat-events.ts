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

export function diffRow(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const events: CombatEventDraft[] = []
  const rowName = after.name

  if (after.hitPoints !== before.hitPoints) {
    const delta = (after.hitPoints ?? 0) - (before.hitPoints ?? 0)
    const overridden = after.maxHitPoints !== before.maxHitPoints

    events.push({
      type: 'hp',
      payload: {
        rowName,
        kind: overridden ? 'override' : delta > 0 ? 'heal' : 'damage',
        amount: Math.abs(delta),
        before: before.hitPoints,
        after: after.hitPoints,
      },
    })
  } else if (after.tempHitPoints !== before.tempHitPoints) {
    events.push({
      type: 'hp',
      payload: {
        rowName,
        kind: 'temp',
        amount: after.tempHitPoints,
        before: before.tempHitPoints,
        after: after.tempHitPoints,
      },
    })
  }

  if (after.armorClass !== before.armorClass) {
    const delta = (after.armorClass ?? 0) - (before.armorClass ?? 0)
    const overridden = after.maxArmorClass !== before.maxArmorClass

    events.push({
      type: 'ac',
      payload: {
        rowName,
        kind: overridden ? 'override' : delta > 0 ? 'add' : 'remove',
        amount: Math.abs(delta),
        before: before.armorClass,
        after: after.armorClass,
      },
    })
  } else if (after.tempArmorClass !== before.tempArmorClass) {
    events.push({
      type: 'ac',
      payload: {
        rowName,
        kind: 'temp',
        amount: after.tempArmorClass,
        before: before.tempArmorClass,
        after: after.tempArmorClass,
      },
    })
  }

  const beforeConditionIds = new Set(before.conditions.map(c => c.id))
  const afterConditionIds = new Set(after.conditions.map(c => c.id))

  for (const condition of after.conditions) {
    if (!beforeConditionIds.has(condition.id)) {
      events.push({
        type: 'condition_added',
        payload: {
          rowName,
          condition: { id: condition.id, name: condition.name },
        },
      })
    }
  }

  for (const condition of before.conditions) {
    if (!afterConditionIds.has(condition.id)) {
      events.push({
        type: 'condition_removed',
        payload: {
          rowName,
          condition: { id: condition.id, name: condition.name },
        },
      })
    }
  }

  if (before.concentration === true && after.concentration === false) {
    events.push({ type: 'concentration_broken', payload: { rowName } })
  } else if (before.concentration === false && after.concentration === true) {
    events.push({ type: 'concentration_started', payload: { rowName } })
  }

  if (before.deathSaves && after.deathSaves) {
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
  }

  return [...events, ...diffFlags(before, after)]
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
