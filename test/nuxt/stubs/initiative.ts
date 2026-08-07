import { vi } from 'vitest'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { sheet as sheetFixture } from '~~/test/fixtures/initiative-sheet'

export function createInitiativeSheetProvide(
  initial: InitiativeSheet | null = sheetFixture,
) {
  const sheet = ref<InitiativeSheet | undefined>(initial ?? undefined)
  const activeRow = ref<InitiativeSheetRow | undefined>(initial?.rows[0])
  const update = vi.fn().mockResolvedValue(undefined)

  return {
    sheet,
    activeRow,
    update,
    provide: { [INITIATIVE_SHEET]: { sheet, activeRow, update } },
  }
}
