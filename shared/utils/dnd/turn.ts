function durationOwner(
  duration: DndConditionDuration,
  row: InitiativeSheetRow,
  rowIds: Set<string>,
): string {
  return rowIds.has(duration.rowId) ? duration.rowId : row.id
}

export function advanceTurn(
  sheet: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'>,
  roll: (sides: number) => number = randomRoll,
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
  const recharges: RechargeReminder[] = []

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

    const updated = changed ? { ...row, conditions } : row

    if (row.id !== starting) return updated

    const refreshed = refreshResources(updated, roll)

    recharges.push(...refreshed.recharges)

    return refreshed.row
  })

  return { activeIndex, round, rows, expired, saves, recharges }
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

const SPELL_DURATION_ROUNDS: Record<string, number> = {
  round: 1,
  turn: 1,
  minute: 10,
  hour: 600,
}

export function spellDurationRounds(duration: string): number | undefined {
  const match = duration
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s+(round|turn|minute|hour)s?$/)

  if (!match) return undefined

  const rounds = Number(match[1]) * SPELL_DURATION_ROUNDS[match[2]!]!

  return rounds <= 100 ? rounds : undefined
}

export function spellDurationPrefill(
  spell: Pick<DndSpell, 'duration' | 'savingThrowAbility'>,
  { rowId, activeRowId }: { rowId: string; activeRowId?: string },
): DndConditionDurationPrefill {
  const rounds = spellDurationRounds(spell.duration)
  const ability = spell.savingThrowAbility ?? undefined

  return {
    rowId: ability ? rowId : (activeRowId ?? rowId),
    timing: ability ? 'end' : 'start',
    ...(rounds && { rounds }),
    ...(ability && { ability }),
  }
}
