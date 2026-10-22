interface UndoableActions {
  update: (payload: UpdateInitiativeSheetData) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  patchRows: (patches: RowPatch[]) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
}

const UNDO_CAPACITY = 20

function isSameSnapshot(a: SheetSnapshot, b: SheetSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useUndoHistory(
  sheet: Ref<InitiativeSheet | undefined>,
  actions: UndoableActions,
) {
  const undoStack = shallowRef<UndoEntry[]>([])
  const redoStack = shallowRef<UndoEntry[]>([])
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function push(entry: UndoEntry): void {
    if (isSameSnapshot(entry.before, entry.after)) return

    undoStack.value = [...undoStack.value, entry].slice(-UNDO_CAPACITY)
    redoStack.value = []
  }

  async function update(payload: UpdateInitiativeSheetData): Promise<void> {
    const before = sheet.value ? snapshotSheet(sheet.value) : undefined

    await actions.update(payload)

    if (!before) return

    push({
      before,
      after: snapshotSheet({
        rows: payload.rows ?? before.rows,
        activeIndex: payload.activeIndex ?? before.activeIndex,
        round: payload.round ?? before.round,
      }),
    })
  }

  async function patchRow(
    rowId: string,
    patch: Partial<InitiativeSheetRow>,
  ): Promise<void> {
    const before = sheet.value ? snapshotSheet(sheet.value) : undefined

    await actions.patchRow(rowId, patch)

    if (!before) return

    push({
      before,
      after: snapshotSheet({
        ...before,
        rows: before.rows.map(row =>
          row.id === rowId ? { ...row, ...patch } : row,
        ),
      }),
    })
  }

  async function patchRows(patches: RowPatch[]): Promise<void> {
    const before = sheet.value ? snapshotSheet(sheet.value) : undefined

    await actions.patchRows(patches)

    if (!before) return

    const byRow = new Map(patches.map(({ rowId, patch }) => [rowId, patch]))

    push({
      before,
      after: snapshotSheet({
        ...before,
        rows: before.rows.map(row => ({ ...row, ...byRow.get(row.id) })),
      }),
    })
  }

  async function nextTurn(): Promise<TurnReminders | undefined> {
    const before = sheet.value ? snapshotSheet(sheet.value) : undefined

    const reminders = await actions.nextTurn()

    if (before && sheet.value) {
      push({ before, after: snapshotSheet(sheet.value) })
    }

    return reminders
  }

  async function step(
    from: ShallowRef<UndoEntry[]>,
    to: ShallowRef<UndoEntry[]>,
    toChange: (entry: UndoEntry) => UndoEntry,
  ): Promise<boolean> {
    const entry = from.value.at(-1)

    if (!entry || !sheet.value) return false

    from.value = from.value.slice(0, -1)

    try {
      await actions.update(
        revertSheet(snapshotSheet(sheet.value), toChange(entry)),
      )
    } catch {
      from.value = [...from.value, entry]

      return false
    }

    to.value = [...to.value, entry].slice(-UNDO_CAPACITY)

    return true
  }

  function undo(): Promise<boolean> {
    return step(undoStack, redoStack, entry => entry)
  }

  function redo(): Promise<boolean> {
    return step(redoStack, undoStack, ({ before, after }) => ({
      before: after,
      after: before,
    }))
  }

  return {
    update,
    patchRow,
    patchRows,
    nextTurn,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
