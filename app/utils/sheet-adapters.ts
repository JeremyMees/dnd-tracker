export function memorySheetAdapter(
  sheet: Ref<InitiativeSheet | undefined>,
): SheetAdapter {
  return {
    async update(data) {
      if (!sheet.value) return

      const fields = mergeSheetUpdate(sheet.value.rows, data)

      sheet.value = {
        ...sheet.value,
        ...fields,
        ...(fields.rows && { rows: indexCorrect(fields.rows) }),
      }
    },
    async patchRows(patches) {
      if (!sheet.value) return

      sheet.value = {
        ...sheet.value,
        rows: withRowPatches(sheet.value.rows, patches),
      }
    },
    async nextTurn() {
      if (!sheet.value) return

      const { activeIndex, round, rows, expired, saves, recharges } =
        advanceTurn(sheet.value)

      sheet.value = { ...sheet.value, activeIndex, round, rows }

      return { expired, saves, recharges }
    },
  }
}
