export function useInitiativeSheet(
  sheet: ComputedRef<InitiativeSheet | undefined>,
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>,
) {
  const defaultColumns = ['index', 'name', 'initiative']
  const hidableColumns = ['ac', 'health', 'conditions', 'note', 'deathSaves', 'concentration', 'modify']

  const expanded = ref<Record<string, boolean>>({})
  const selected = ref<Record<string, boolean>>({})

  const columnVisibility = computed(() => {
    const rows = sheet.value?.settings
      ? sheet.value.settings.modified ? (sheet.value.settings.rows || []) : hidableColumns
      : hidableColumns

    return [...defaultColumns, ...hidableColumns].reduce((acc, column) => {
      const defaultColumn = defaultColumns.includes(column)
      acc[column] = defaultColumn || !sheet.value ? true : rows.includes(column)
      return acc
    }, {} as Record<string, boolean>)
  })

  onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (e) => {
    e.preventDefault()

    if ((!e.shiftKey && !e.metaKey) || !sheet.value) return

    const current = sheet.value.rows[sheet.value.activeIndex]?.id

    if (!current) return

    if (e.key === 'Enter') {
      if (current in expanded.value) delete expanded.value[current]
      else expanded.value[current] = true
    }
    else if (e.key === 'ArrowLeft') previous()
    else if (e.key === 'ArrowRight') next()
  })

  watch(() => sheet.value?.activeIndex, () => {
    if (sheet.value?.rows.length) {
      const active = sheet.value.activeIndex
      const row = sheet.value.rows[active] ? active : 0

      if (!sheet.value.rows[row]) return

      selected.value = { [sheet.value.rows[row].id]: true }
    }
  }, { immediate: true })

  watch(() => sheet.value?.rows, () => {
    expanded.value = {} // this is a hack otherwise the table doesn't update when the data changes

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
  }, { immediate: true })

  function previous(): void {
    if (!sheet.value) return

    const isAtStart = sheet.value.activeIndex === 0

    if (isAtStart && sheet.value.round <= 1) return

    const activeIndex = isAtStart ? sheet.value.rows.length - 1 : sheet.value.activeIndex - 1
    const round = isAtStart ? sheet.value.round - 1 : sheet.value.round

    update({ activeIndex, round })

    const index = sheet.value.rows[activeIndex] ? activeIndex : 0

    if (!sheet.value.rows[index]) return

    selected.value = { [sheet.value.rows[index].id]: true }
  }

  function next(): void {
    if (!sheet.value) return

    const isAtEnd = sheet.value.activeIndex + 1 >= sheet.value.rows.length
    const activeIndex = isAtEnd ? 0 : sheet.value.activeIndex + 1
    const round = isAtEnd ? sheet.value.round + 1 : sheet.value.round

    update({ activeIndex, round })

    const index = sheet.value.rows[activeIndex] ? activeIndex : 0

    if (!sheet.value.rows[index]) return

    selected.value = { [sheet.value.rows[index].id]: true }
  }

  function reset(hard: boolean): void {
    if (!sheet.value) return

    let updatePayload: Omit<Partial<InitiativeSheet>, NotUpdatable> = { activeIndex: 0, round: 1 }

    if (hard) {
      updatePayload = {
        ...updatePayload,
        rows: sheet.value.rows.map(row => ({
          ...row,
          initiative: -1,
          conditions: [],
          ...(row.concentration !== undefined && { concentration: false }),
          ...(row.deathSaves !== undefined && {
            deathSaves: {
              fail: [false, false, false],
              save: [false, false, false],
            },
          }),
          ...(row.ac !== undefined && { ac: row.maxAcOld || row.maxAc }),
          ...(row.health !== undefined && { health: row.maxHealthOld || row.maxHealth }),
          ...(row.maxAcOld !== undefined && { maxAc: row.maxAcOld }),
          ...(row.maxHealthOld !== undefined && { maxHealth: row.maxHealthOld }),
          maxAcOld: undefined,
          maxHealthOld: undefined,
          tempHealth: undefined,
          tempAc: undefined,
        })),
      }
    }

    update(updatePayload)

    if (!sheet.value.rows[0]) return

    selected.value = { [sheet.value.rows[0].id]: true }
  }

  return {
    expanded,
    selected,
    columnVisibility,
    previous,
    next,
    reset,
  }
}
