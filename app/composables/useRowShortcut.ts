export function useRowShortcut() {
  const request = useState<RowShortcutRequest | undefined>(
    'row-shortcut',
    () => undefined,
  )

  const targetId = useState<string | undefined>(
    'row-shortcut-target',
    () => undefined,
  )

  function targetRowId(sheet: InitiativeSheet | undefined): string | undefined {
    if (!sheet) return undefined

    const target = sheet.rows.find(row => row.id === targetId.value)

    return target?.id ?? sheet.rows[sheet.activeIndex]?.id
  }

  function moveTarget(sheet: InitiativeSheet | undefined, step: 1 | -1): void {
    const rows = sheet?.rows ?? []

    if (!rows.length) return

    const current = rows.findIndex(row => row.id === targetRowId(sheet))
    const next = (current + step + rows.length) % rows.length

    targetId.value = rows[next]?.id
  }

  function trigger(rowId: string, action: RowShortcutAction): void {
    request.value = { rowId, action }
  }

  function onRequest(
    rowId: MaybeRefOrGetter<string>,
    actions: RowShortcutAction[],
    handler: (action: RowShortcutAction) => void,
  ): void {
    watch(request, value => {
      if (!value || value.rowId !== toValue(rowId)) return
      if (!actions.includes(value.action)) return

      request.value = undefined
      handler(value.action)
    })
  }

  function isTarget(
    sheet: InitiativeSheet | undefined,
    rowId: string,
  ): boolean {
    return targetRowId(sheet) === rowId
  }

  return {
    request,
    targetId,
    targetRowId,
    moveTarget,
    trigger,
    onRequest,
    isTarget,
  }
}
