function durationOwner(
  duration: DndConditionDuration,
  row: InitiativeSheetRow,
  rowIds: Set<string>,
): string {
  return rowIds.has(duration.rowId) ? duration.rowId : row.id
}

export function nextTurnPosition(
  sheet: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'> &
    Partial<Pick<InitiativeSheet, 'settings'>>,
): Pick<InitiativeSheet, 'activeIndex' | 'round'> {
  const skipDead = isSkipDeadMonstersEnabled(sheet.settings)
  let activeIndex = sheet.activeIndex
  let round = sheet.round

  for (const _ of sheet.rows) {
    activeIndex += 1

    if (activeIndex >= sheet.rows.length) {
      activeIndex = 0
      round += 1
    }

    const row = sheet.rows[activeIndex]
    if (!skipDead || !row || !isDeadMonster(row)) return { activeIndex, round }
  }

  const isAtEnd = sheet.activeIndex + 1 >= sheet.rows.length

  return {
    activeIndex: isAtEnd ? 0 : sheet.activeIndex + 1,
    round: isAtEnd ? sheet.round + 1 : sheet.round,
  }
}

export function advanceTurn(
  sheet: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'> &
    Partial<Pick<InitiativeSheet, 'settings'>>,
  roll: (sides: number) => number = randomRoll,
): TurnAdvance {
  const { activeIndex, round } = nextTurnPosition(sheet)

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

    return refreshed.row.readied
      ? { ...refreshed.row, readied: false }
      : refreshed.row
  })

  return { activeIndex, round, rows, expired, saves, recharges }
}

export function previousTurnPosition(
  sheet: Pick<InitiativeSheet, 'rows' | 'activeIndex' | 'round'>,
): Pick<InitiativeSheet, 'activeIndex' | 'round'> | undefined {
  const isAtStart = sheet.activeIndex === 0

  if (isAtStart && sheet.round <= 1) return undefined

  return {
    activeIndex: isAtStart ? sheet.rows.length - 1 : sheet.activeIndex - 1,
    round: isAtStart ? sheet.round - 1 : sheet.round,
  }
}

function hardResetRow(row: InitiativeSheetRow): InitiativeSheetRow {
  return {
    ...row,
    initiative: defaultInitiative(row.type),
    conditions: [],
    ...(row.concentration !== undefined && { concentration: false }),
    ...(row.deathSaves !== undefined && { deathSaves: resetDeathSaves() }),
    ...(row.armorClass !== undefined && { armorClass: getBaseAC(row) }),
    ...(row.hitPoints !== undefined && { hitPoints: getBaseHP(row) }),
    ...(isDefined(row.maxArmorClassOld) && {
      maxArmorClass: row.maxArmorClassOld,
    }),
    ...(isDefined(row.maxHitPointsOld) && {
      maxHitPoints: row.maxHitPointsOld,
    }),
    readied: undefined,
    resources: undefined,
    maxArmorClassOld: undefined,
    maxHitPointsOld: undefined,
    tempHitPoints: undefined,
    tempArmorClass: undefined,
  }
}

export function resetEncounter(
  rows: InitiativeSheetRow[],
  { hard }: { hard: boolean },
): InitiativeSheetUpdate {
  if (hard) return { activeIndex: 0, round: 1, rows: rows.map(hardResetRow) }

  return {
    activeIndex: 0,
    round: 1,
    ...(rows.some(row => row.readied) && {
      rows: rows.map(row => ({ ...row, readied: undefined })),
    }),
  }
}

export function resolveSave(
  row: Pick<InitiativeSheetRow, 'conditions'>,
  conditionId: string,
): Pick<InitiativeSheetRow, 'conditions'> {
  return {
    conditions: row.conditions.filter(item => item.id !== conditionId),
  }
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
  const match = /^(\d+)\s+(round|turn|minute|hour)s?$/.exec(
    duration.trim().toLowerCase(),
  )

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
