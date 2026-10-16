export function useRowShortcut() {
  const request = useState<RowShortcutRequest | undefined>(
    'row-shortcut',
    () => undefined,
  )

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
    return !!sheet && sheet.rows[sheet.activeIndex]?.id === rowId
  }

  return { request, trigger, onRequest, isTarget }
}
