function changedFields(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): (keyof InitiativeSheetRow)[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])

  return [...keys].filter(
    key =>
      JSON.stringify(before[key as keyof InitiativeSheetRow]) !==
      JSON.stringify(after[key as keyof InitiativeSheetRow]),
  ) as (keyof InitiativeSheetRow)[]
}

export function revertRow(
  current: InitiativeSheetRow,
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): InitiativeSheetRow {
  const changed = new Set<string>(changedFields(before, after))
  const kept = Object.entries(current).filter(([field]) => !changed.has(field))
  const restored = Object.entries(before).filter(([field]) =>
    changed.has(field),
  )

  return Object.fromEntries([...kept, ...restored]) as InitiativeSheetRow
}

export function revertRows(
  current: InitiativeSheetRow[],
  before: InitiativeSheetRow[],
  after: InitiativeSheetRow[],
): InitiativeSheetRow[] {
  const currentById = new Map(current.map(row => [row.id, row]))
  const afterById = new Map(after.map(row => [row.id, row]))
  const beforeIds = new Set(before.map(row => row.id))

  const restored = before.flatMap(row => {
    const now = currentById.get(row.id)
    const changed = afterById.get(row.id)

    if (!changed) return [now ?? row]
    if (!now) return []

    return [revertRow(now, row, changed)]
  })

  const addedSince = current.filter(
    row => !beforeIds.has(row.id) && !afterById.has(row.id),
  )

  return [...restored, ...addedSince].map((row, index) => ({ ...row, index }))
}

export function revertSheet(
  current: SheetSnapshot,
  { before, after }: UndoEntry,
): SheetSnapshot {
  const turnChanged =
    before.activeIndex !== after.activeIndex || before.round !== after.round

  return {
    rows: revertRows(current.rows, before.rows, after.rows),
    activeIndex: turnChanged ? before.activeIndex : current.activeIndex,
    round: turnChanged ? before.round : current.round,
  }
}

export function snapshotSheet(sheet: SheetSnapshot): SheetSnapshot {
  return JSON.parse(
    JSON.stringify({
      rows: sheet.rows,
      activeIndex: sheet.activeIndex,
      round: sheet.round,
    }),
  )
}
