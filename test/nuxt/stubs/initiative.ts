import { vi } from 'vitest'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet as sheetFixture } from '~~/test/fixtures/initiative-sheet'

export function createInitiativeSheetProvide(
  initial: InitiativeSheet | null = sheetFixture,
) {
  const sheet = ref<InitiativeSheet | undefined>(initial ?? undefined)
  const activeRow = ref<InitiativeSheetRow | undefined>(initial?.rows[0])
  const editRows = vi.fn().mockResolvedValue(undefined)
  const updateSheet = vi.fn().mockResolvedValue(undefined)

  return {
    sheet,
    activeRow,
    editRows,
    updateSheet,
    provide: {
      [INITIATIVE_SHEET]: { sheet, activeRow, editRows, updateSheet },
    },
  }
}
