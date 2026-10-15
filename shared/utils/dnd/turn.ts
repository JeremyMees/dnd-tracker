function durationOwner(
  duration: DndConditionDuration,
  row: InitiativeSheetRow,
  rowIds: Set<string>,
): string {
  return rowIds.has(duration.rowId) ? duration.rowId : row.id
}

export function advanceTurn(
  sheet: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'>,
): TurnAdvance {
  const isAtEnd = sheet.activeIndex + 1 >= sheet.rows.length
  const activeIndex = isAtEnd ? 0 : sheet.activeIndex + 1
  const round = isAtEnd ? sheet.round + 1 : sheet.round

  const boundaries: { rowId: string; timing: DndConditionTiming }[] = []
  const ending = sheet.rows[sheet.activeIndex]?.id
  const starting = sheet.rows[activeIndex]?.id

  if (ending) boundaries.push({ rowId: ending, timing: 'end' })
  if (starting) boundaries.push({ rowId: starting, timing: 'start' })

  const rowIds = new Set(sheet.rows.map(row => row.id))
  const expired: TurnReminder[] = []
  const saves: TurnReminder[] = []

  const rows = sheet.rows.map(row => {
    let changed = false

    const conditions = row.conditions.flatMap(condition => {
      const { duration } = condition

      if (!duration) return [condition]

      const owner = durationOwner(duration, row, rowIds)
      const hit = boundaries.some(
        boundary =>
          boundary.rowId === owner && boundary.timing === duration.timing,
      )

      if (!hit) return [condition]

      const reminder = { rowId: row.id, rowName: row.name, condition }

      if (duration.rounds) {
        changed = true

        if (duration.rounds <= 1) {
          expired.push(reminder)
          return []
        }

        if (duration.save) saves.push(reminder)

        return [
          {
            ...condition,
            duration: { ...duration, rounds: duration.rounds - 1 },
          },
        ]
      }

      if (duration.save) saves.push(reminder)

      return [condition]
    })

    return changed ? { ...row, conditions } : row
  })

  return { activeIndex, round, rows, expired, saves }
}

export function conditionDurationPreset(
  preset: DndConditionPreset,
  { rowId, activeRowId }: { rowId: string; activeRowId?: string },
): DndConditionDuration {
  const actorId = activeRowId ?? rowId

  if (preset === 'endOfNextTurn') {
    return { rowId, timing: 'end', rounds: rowId === activeRowId ? 2 : 1 }
  }

  if (preset === 'startOfNextTurn') {
    return { rowId: actorId, timing: 'start', rounds: 1 }
  }

  return { rowId: actorId, timing: 'start', rounds: 10 }
}
