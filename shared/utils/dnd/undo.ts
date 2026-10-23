import { rowPatchSchema } from '~~/shared/utils/dnd/schema'

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

export function mergeRows(
  current: InitiativeSheetRow[],
  base: InitiativeSheetRow[],
  edited: InitiativeSheetRow[],
): InitiativeSheetRow[] {
  return revertRows(current, edited, base)
}

export function mergeSheetUpdate(
  current: InitiativeSheetRow[],
  { baseRows, ...update }: InitiativeSheetUpdate,
): InitiativeSheetFields {
  return update.rows && baseRows
    ? { ...update, rows: mergeRows(current, baseRows, update.rows) }
    : update
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

const patchableFields = new Set(Object.keys(rowPatchSchema.shape))

function sameTurn(a: SheetSnapshot, b: SheetSnapshot): boolean {
  return a.activeIndex === b.activeIndex && a.round === b.round
}

export function patchesBetween(
  current: SheetSnapshot,
  target: SheetSnapshot,
): RowPatch[] | undefined {
  if (!sameTurn(current, target)) return undefined
  if (current.rows.length !== target.rows.length) return undefined

  const patches: RowPatch[] = []

  for (const [index, row] of current.rows.entries()) {
    const next = target.rows[index]

    if (next?.id !== row.id) return undefined

    const fields = changedFields(row, next)

    if (
      fields.some(
        field => !patchableFields.has(field) || next[field] === undefined,
      )
    ) {
      return undefined
    }

    if (fields.length) {
      patches.push({
        rowId: row.id,
        patch: Object.fromEntries(fields.map(field => [field, next[field]])),
      })
    }
  }

  return patches
}
