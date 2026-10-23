import type { RowSelectionState } from '@tanstack/vue-table'

export function useInitiativeSheet(
  sheet: ComputedRef<InitiativeSheet | undefined>,
  update: (
    payload: Omit<Partial<InitiativeSheet>, NotUpdatable>,
  ) => Promise<void>,
  nextTurn: () => Promise<void>,
) {
  const defaultColumns = new Set(['index', 'name', 'initiative'])
  const hidableColumns = [
    'armorClass',
    'hitPoints',
    'conditions',
    'note',
    'deathSaves',
    'concentration',
    'modify',
  ]

  const expanded = ref<Record<string, boolean>>({})
  const selected = ref<RowSelectionState>({})

  const active = computed(() => {
    const selectedRowId = Object.keys(selected.value).find(
      key => selected.value[key] === true,
    )
    return sheet.value?.rows.find(row => row.id === selectedRowId)
  })

  const columnVisibility = computed(() => {
    const rows = new Set(
      sheet.value?.settings?.modified
        ? sheet.value.settings.rows || []
        : hidableColumns,
    )

    return [...defaultColumns, ...hidableColumns].reduce(
      (acc, column) => {
        const defaultColumn = defaultColumns.has(column)
        acc[column] = defaultColumn || !sheet.value ? true : rows.has(column)
        return acc
      },
      {} as Record<string, boolean>,
    )
  })

  onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], e => {
    if ((!e.shiftKey && !e.metaKey) || !sheet.value || isTypingTarget(e.target))
      return

    e.preventDefault()

    const current = sheet.value.rows[sheet.value.activeIndex]?.id

    if (!current) return

    if (e.key === 'Enter') {
      if (current in expanded.value) {
        const { [current]: _collapsed, ...rest } = expanded.value
        expanded.value = rest
      } else {
        expanded.value = { ...expanded.value, [current]: true }
      }
    } else if (e.key === 'ArrowLeft') previous()
    else if (e.key === 'ArrowRight') next()
  })

  const {
    trigger: triggerRowShortcut,
    targetId,
    targetRowId,
    moveTarget,
  } = useRowShortcut()

  const target = computed(() =>
    sheet.value?.rows.find(row => row.id === targetRowId(sheet.value)),
  )

  onKeyStroke(['ArrowUp', 'ArrowDown'], e => {
    if (!e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    if (!isShortcutContext(e.target) || !sheet.value?.rows.length) return

    e.preventDefault()
    moveTarget(sheet.value, e.key === 'ArrowDown' ? 1 : -1)
  })

  onKeyStroke('Escape', e => {
    if (!targetId.value || !isShortcutContext(e.target)) return

    targetId.value = undefined
  })

  const rowShortcutKeys: Record<string, RowShortcutAction> = {
    d: 'damage',
    h: 'heal',
    c: 'condition',
  }

  onKeyStroke(Object.keys(rowShortcutKeys), e => {
    if (e.shiftKey || !isPlainKeyPress(e) || !target.value) return

    const action = rowShortcutKeys[e.key]

    if (!action) return

    e.preventDefault()
    triggerRowShortcut(target.value.id, action)
  })

  watch(
    () => sheet.value?.activeIndex,
    () => {
      targetId.value = undefined

      if (sheet.value?.rows.length) {
        const active = sheet.value.activeIndex
        const row = sheet.value.rows[active] ? active : 0

        if (!sheet.value.rows[row]) return

        selected.value = { [sheet.value.rows[row].id]: true }
      }
    },
    { immediate: true },
  )

  watch(
    () => sheet.value?.rows,
    () => {
      if (!sheet.value?.rows?.length) return

      const active = sheet.value.activeIndex
      const row = sheet.value.rows[active]

      if (!row) return

      const current = row.id
      const currentSelected = Object.keys(selected.value).includes(current)
      const index = sheet.value.rows[active] ? active : 0

      if (!sheet.value.rows[index]) return

      if (!currentSelected) {
        selected.value = { [sheet.value.rows[index].id]: true }
      }
    },
    { immediate: true },
  )

  function previous(): void {
    if (!sheet.value) return

    const isAtStart = sheet.value.activeIndex === 0

    if (isAtStart && sheet.value.round <= 1) return

    const activeIndex = isAtStart
      ? sheet.value.rows.length - 1
      : sheet.value.activeIndex - 1
    const round = isAtStart ? sheet.value.round - 1 : sheet.value.round

    update({ activeIndex, round }).catch(() => undefined)

    const index = sheet.value.rows[activeIndex] ? activeIndex : 0

    if (!sheet.value.rows[index]) return

    selected.value = { [sheet.value.rows[index].id]: true }
  }

  function next(): void {
    if (!sheet.value) return

    const { activeIndex } = nextTurnPosition(sheet.value)

    nextTurn().catch(() => undefined)

    const index = sheet.value.rows[activeIndex] ? activeIndex : 0

    if (!sheet.value.rows[index]) return

    selected.value = { [sheet.value.rows[index].id]: true }
  }

  function reset(hard: boolean): void {
    if (!sheet.value) return

    const isReadied = sheet.value.rows.some(row => row.readied)

    let updatePayload: Omit<Partial<InitiativeSheet>, NotUpdatable> = {
      activeIndex: 0,
      round: 1,
      ...(isReadied && {
        rows: sheet.value.rows.map(row => ({ ...row, readied: undefined })),
      }),
    }

    if (hard) {
      updatePayload = {
        ...updatePayload,
        rows: sheet.value.rows.map(row => ({
          ...row,
          initiative: defaultInitiative(row.type),
          conditions: [],
          ...(row.concentration !== undefined && { concentration: false }),
          ...(row.deathSaves !== undefined && {
            deathSaves: {
              fail: [false, false, false],
              save: [false, false, false],
            },
          }),
          ...(row.armorClass !== undefined && {
            armorClass: row.maxArmorClassOld || row.maxArmorClass,
          }),
          ...(row.hitPoints !== undefined && {
            hitPoints: row.maxHitPointsOld || row.maxHitPoints,
          }),
          ...(isDefined(row.maxArmorClassOld) && {
            maxArmorClass: row.maxArmorClassOld,
          }),
          ...(isDefined(row.maxHitPointsOld) && {
            maxHitPoints: row.maxHitPointsOld,
          }),
          readied: undefined,
          maxArmorClassOld: undefined,
          maxHitPointsOld: undefined,
          tempHitPoints: undefined,
          tempArmorClass: undefined,
        })),
      }
    }

    update(updatePayload).catch(() => undefined)

    if (!sheet.value.rows[0]) return

    selected.value = { [sheet.value.rows[0].id]: true }
  }

  return {
    active,
    target,
    expanded,
    selected,
    columnVisibility,
    previous,
    next,
    reset,
  }
}
