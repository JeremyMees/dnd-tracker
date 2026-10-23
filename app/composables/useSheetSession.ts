const UNDO_CAPACITY = 20

function isSameSnapshot(a: SheetSnapshot, b: SheetSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useSheetSession(
  sheet: Ref<InitiativeSheet | undefined>,
  adapter: SheetAdapter,
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

  async function recorded<T>(
    change: () => Promise<T>,
    after: (before: SheetSnapshot) => SheetSnapshot,
  ): Promise<T | undefined> {
    if (!sheet.value) return undefined

    const before = snapshotSheet(sheet.value)
    const result = await change()

    push({ before, after: snapshotSheet(after(before)) })

    return result
  }

  function patchRows(patches: RowPatch[]): Promise<void> {
    return recorded(
      () => adapter.patchRows(patches),
      before => ({ ...before, rows: withRowPatches(before.rows, patches) }),
    )
  }

  function patchRow(
    rowId: string,
    patch: Partial<InitiativeSheetRow>,
  ): Promise<void> {
    return patchRows([{ rowId, patch }])
  }

  function update(data: UpdateInitiativeSheetData): Promise<void> {
    return recorded(
      () => adapter.update(data),
      before => ({
        rows: data.rows ?? before.rows,
        activeIndex: data.activeIndex ?? before.activeIndex,
        round: data.round ?? before.round,
      }),
    )
  }

  function editRows(rows: InitiativeSheetRow[]): Promise<void> {
    return update({ rows })
  }

  function updateSheet(fields: SheetFieldsUpdate): Promise<void> {
    return update(fields)
  }

  function previousTurn(): Promise<void> {
    const position = sheet.value && previousTurnPosition(sheet.value)

    return position ? update(position) : Promise.resolve()
  }

  function reset(hard: boolean): Promise<void> {
    if (!sheet.value) return Promise.resolve()

    return update(resetEncounter(sheet.value.rows, { hard }))
  }

  function nextTurn(): Promise<TurnReminders | undefined> {
    return recorded(adapter.nextTurn, before =>
      sheet.value ? snapshotSheet(sheet.value) : before,
    )
  }

  async function write(target: SheetSnapshot): Promise<void> {
    if (!sheet.value) return

    const patches = patchesBetween(snapshotSheet(sheet.value), target)

    if (!patches) await adapter.update(target)
    else if (patches.length) await adapter.patchRows(patches)
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
      await write(revertSheet(snapshotSheet(sheet.value), toChange(entry)))
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
    sheet,
    patchRows,
    patchRow,
    editRows,
    updateSheet,
    nextTurn,
    previousTurn,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
